#include <iostream>
#include <Eigen/Dense>
#include <fstream>
#include <iterator>
#include <RedSVD-h>
#include <cmath>
#include <thread>
#include <future>
#include <emscripten/bind.h>
#include <stdio.h>

using namespace emscripten;

Eigen::MatrixXd get_compressed_image(Eigen::MatrixXd &mat, int rank, char component)
{

    RedSVD::RedSVD<Eigen::MatrixXd> mtr(mat, rank);

    Eigen::MatrixXd U = mtr.matrixU();

    Eigen::MatrixXd S = Eigen::MatrixXd(mtr.singularValues().asDiagonal());
    Eigen::MatrixXd V = mtr.matrixV();
    V.transposeInPlace();

    Eigen::MatrixXd compressed = U * S * V;

    printf("%c component compressed\n", component);
    return compressed;
}

double roundValue(double value)
{
    if (value > 255)
    {
        return 255;
    }
    else if (value < 0)
    {
        return 0;
    }
    return lround(value);
}
void reconstruct_image(Eigen::MatrixXd &img_r, Eigen::MatrixXd &img_g, Eigen::MatrixXd &img_b, uintptr_t bufferStart)
{
    auto r_vec = img_r.reshaped();
    auto g_vec = img_g.reshaped();
    auto b_vec = img_b.reshaped();

    // bufferStart is a pointer to the start of the buffer allocated in JS
    // doing this allows us to write to the buffer directly
    // preventing the need to copy the data to a new vector and then copy it back to the buffer in JS
    auto final_img = reinterpret_cast<uint8_t *>(bufferStart);

    for (int i{0}, j{0}; i < r_vec.size(); i++)
    {

        final_img[j++] = roundValue(r_vec[i]);
        final_img[j++] = roundValue(g_vec[i]);
        final_img[j++] = roundValue(b_vec[i]);
        final_img[j++] = 255;
    }
}

typedef Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic> MyMatrix;
// TODO CHANGE FN NAME
void get_compressed_img(
    int len,
    int wd,
    int rank,
    uintptr_t imageBufferStart)
{
    auto start = std::chrono::steady_clock::now();

    auto inputImagePixels = reinterpret_cast<uint8_t *>(imageBufferStart);
    double *r_ptr = new double[len * wd];
    double *g_ptr = new double[len * wd];
    double *b_ptr = new double[len * wd];

    for (int i{0}, j{0}; i < len * wd; i++)
    {
        r_ptr[i] = inputImagePixels[j++];
        g_ptr[i] = inputImagePixels[j++];
        b_ptr[i] = inputImagePixels[j++];
        j++;
    }

    size_t nrow = len;
    size_t ncol = wd;
    MyMatrix img_r = Eigen::Map<MyMatrix>(r_ptr, nrow, ncol);

    MyMatrix img_g = Eigen::Map<MyMatrix>(g_ptr, nrow, ncol);
    MyMatrix img_b = Eigen::Map<MyMatrix>(b_ptr, nrow, ncol);

    printf("STEP 1 DONE\n");

    std::future<Eigen::MatrixXd>
        f1 = std::async(std::launch::async, get_compressed_image, std::ref(img_r), rank, 'R');

    std::future<Eigen::MatrixXd> f2 = std::async(std::launch::async, get_compressed_image, std::ref(img_g), rank, 'G');
    std::future<Eigen::MatrixXd> f3 = std::async(std::launch::async, get_compressed_image, std::ref(img_b), rank, 'B');

    printf("threads created\n");
    Eigen::
        MatrixXd compressed_img_r = f1.get();

    Eigen::
        MatrixXd compressed_img_g = f2.get();

    Eigen::
        MatrixXd compressed_img_b = f3.get();

    reconstruct_image(compressed_img_r, compressed_img_g, compressed_img_b, imageBufferStart);

    auto end = std::chrono::steady_clock::now();

    printf("Time taken by C++: %lld ms\n", std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

    // free the memory to prevent memory leaks
    delete[] r_ptr;
    delete[] g_ptr;
    delete[] b_ptr;
}

EMSCRIPTEN_BINDINGS(my_module)
{
    function("get_compressed_img", &get_compressed_img);
}
