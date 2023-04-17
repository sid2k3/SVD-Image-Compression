#include <iostream>
#include <Eigen/Dense>
#include <fstream>
#include <iterator>
#include <RedSVD-h>
#include <cmath>
#include <thread>
#include <future>
#include <emscripten/bind.h>

using namespace emscripten;

Eigen::MatrixXd get_compressed_image(Eigen::MatrixXd &mat, int rank, char component)
{

    RedSVD::RedSVD<Eigen::MatrixXd> mtr(mat, rank);
    std::cout << mat.size() << std::endl;

    Eigen::MatrixXd U = mtr.matrixU();

    Eigen::MatrixXd S = Eigen::MatrixXd(mtr.singularValues().asDiagonal());
    Eigen::MatrixXd V = mtr.matrixV();
    V.transposeInPlace();

    Eigen::MatrixXd compressed = U * S * V;
    std::cout << component << " component compressed" << std::endl;
    return compressed;
}

std::vector<std::vector<double>> get_image_matrix(int width, int length)
{

    std::vector<int> pixel_sequence;

    std::ifstream myfile("mat.txt");

    int temp;
    while (myfile >> temp)
    {
        pixel_sequence.push_back(temp);
    }

    std::vector<double> img_r;
    std::vector<double> img_g;
    std::vector<double> img_b;

    int cur_pos = 0;
    while (img_r.size() != length * width)
    {

        img_r.push_back(pixel_sequence[cur_pos]);
        cur_pos += 3;
    }

    cur_pos = 1;
    while (img_g.size() != length * width)
    {

        img_g.push_back(pixel_sequence[cur_pos]);
        cur_pos += 3;
    }
    cur_pos = 2;
    while (img_b.size() != length * width)
    {

        img_b.push_back(pixel_sequence[cur_pos]);
        cur_pos += 3;
    }
    return {img_r, img_g, img_b};
}
std::vector<int> reconstruct_image(Eigen::MatrixXd &img_r, Eigen::MatrixXd &img_g, Eigen::MatrixXd &img_b)
{
    std::vector<double> r_vec;
    std::vector<double> g_vec;
    std::vector<double> b_vec;

    for (auto &x : img_r.reshaped())
    {
        if (x > 255)
            x = 255;

        if (x < 0)
            x = 0;
        r_vec.push_back(x);
    }
    for (auto &x : img_g.reshaped())
    {
        if (x > 255)
            x = 255;

        if (x < 0)
            x = 0;
        g_vec.push_back(x);
    }

    for (auto &x : img_b.reshaped())
    {
        if (x > 255)
            x = 255;

        if (x < 0)
            x = 0;
        b_vec.push_back(x);
    }

    std::vector<int> final_img;
    for (int i{0}; i < r_vec.size(); i++)
    {

        final_img.push_back(lround(r_vec[i]));
        final_img.push_back(lround(g_vec[i]));
        final_img.push_back(lround(b_vec[i]));
    }
    return final_img;
}

typedef Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic> MyMatrix;
// TODO CHANGE FN NAME
std::vector<int> get_compressed_img(int len, int wd, int rank, std::vector<double> &r_vec, std::vector<double> &g_vec, std::vector<double> &b_vec)
{
    // std::cout << len << " -> " << wd << std::endl;

    // std::vector<std::vector<double>> rgb_mat = get_image_matrix(len, wd);
    double *r_ptr = r_vec.data();
    double *g_ptr = g_vec.data();
    double *b_ptr = b_vec.data();

    std::cout << "ok" << std::endl;
    size_t nrow = len;
    size_t ncol = wd;
    MyMatrix img_r = Eigen::Map<MyMatrix>(r_ptr, nrow, ncol);

    MyMatrix img_g = Eigen::Map<MyMatrix>(g_ptr, nrow, ncol);
    MyMatrix img_b = Eigen::Map<MyMatrix>(b_ptr, nrow, ncol);

    std::cout << "STEP 1 DONE" << std::endl;

    std::future<Eigen::MatrixXd> f1 = std::async(std::launch::async, get_compressed_image, std::ref(img_r), rank, 'R');

    std::future<Eigen::MatrixXd> f2 = std::async(std::launch::async, get_compressed_image, std::ref(img_g), rank, 'G');
    std::future<Eigen::MatrixXd> f3 = std::async(std::launch::async, get_compressed_image, std::ref(img_b), rank, 'B');
    std::cout << "threads created" << std::endl;
    Eigen::
        MatrixXd compressed_img_r = f1.get();

    Eigen::
        MatrixXd compressed_img_g = f2.get();

    Eigen::
        MatrixXd compressed_img_b = f3.get();

    return reconstruct_image(compressed_img_r, compressed_img_g, compressed_img_b);
}

EMSCRIPTEN_BINDINGS(my_module)
{
    register_vector<int>("VectorInt");
    register_vector<double>("VectorDouble");
    register_vector<std::vector<int>>("VectorVectorInt");
    function("get_compressed_img", &get_compressed_img);
}

// int main()
// {
//     std::vector<double> vr;
//     std::vector<double> vg;
//     std::vector<double> vb;

//     for (int i{0}; i < 9; i++)
//     {
//         vr.push_back(10);
//         vg.push_back(40);
//         vb.push_back(240);
//     }

//     std::vector<int> temp = get_compressed_img(3, 3, 1, vr, vg, vb);
//     for (auto &e : temp)
//         std::cout << e << " ";

//     std::cout << std::endl;
// }
