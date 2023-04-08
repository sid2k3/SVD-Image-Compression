#include <iostream>
#include <Eigen/Dense>
#include <fstream>
#include <iterator>
#include <RedSVD-h>
#include <cmath>
#include <thread>
#include <future>
using namespace std;

Eigen::MatrixXd get_compressed_image(Eigen::MatrixXd &mat, int rank, char component)
{

    RedSVD::RedSVD mtr(mat, rank);

    Eigen::MatrixXd U = mtr.matrixU();

    Eigen::MatrixXd S = Eigen::MatrixXd(mtr.singularValues().asDiagonal());
    Eigen::MatrixXd V = mtr.matrixV();
    V.transposeInPlace();

    Eigen::MatrixXd compressed = U * S * V;
    cout << component << " component compressed" << endl;
    return compressed;
}

vector<vector<double>> get_image_matrix(int width, int length)
{

    vector<int> pixel_sequence;

    std::ifstream myfile("mat.txt");

    int temp;
    while (myfile >> temp)
    {
        pixel_sequence.push_back(temp);
    }

    vector<double> img_r;
    vector<double> img_g;
    vector<double> img_b;

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
void reconstruct_image(Eigen::MatrixXd &img_r, Eigen::MatrixXd &img_g, Eigen::MatrixXd &img_b)
{
    vector<double> r_vec;
    vector<double> g_vec;
    vector<double> b_vec;

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

    vector<int> final_img;
    for (int i{0}; i < r_vec.size(); i++)
    {

        final_img.push_back(lround(r_vec[i]));
        final_img.push_back(lround(g_vec[i]));
        final_img.push_back(lround(b_vec[i]));
    }
    std::ofstream output_file("compressed_mat.txt");

    std::ostream_iterator<int> output_iterator(output_file, " ");
    std::copy(std::begin(final_img), std::end(final_img), output_iterator);
}

typedef Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic> MyMatrix;

int main(int argc, char **argv)
{

    int len, wd;
    len = atoi(argv[1]);
    wd = atoi(argv[2]);
    cout << len << " -> " << wd << endl;

    vector<vector<double>> rgb_mat = get_image_matrix(len, wd);
    double *r_vec = rgb_mat[0].data();
    double *g_vec = rgb_mat[1].data();
    double *b_vec = rgb_mat[2].data();

    size_t nrow = len;
    size_t ncol = wd;
    MyMatrix img_r = Eigen::Map<MyMatrix>(rgb_mat[0].data(), nrow, ncol);

    MyMatrix img_g = Eigen::Map<MyMatrix>(rgb_mat[1].data(), nrow, ncol);
    MyMatrix img_b = Eigen::Map<MyMatrix>(rgb_mat[2].data(), nrow, ncol);

    cout << "STEP 1 DONE" << endl;
    int rank;
    cout << "Enter Rank:" << endl;
    cin >> rank;

    // cout << "DONE" << endl;

    future<Eigen::MatrixXd> f1 = async(std::launch::async, get_compressed_image, std::ref(img_r), rank, 'R');

    future<Eigen::MatrixXd> f2 = async(std::launch::async, get_compressed_image, std::ref(img_g), rank, 'G');
    future<Eigen::MatrixXd> f3 = async(std::launch::async, get_compressed_image, std::ref(img_b), rank, 'B');

    Eigen::
        MatrixXd compressed_img_r = f1.get();

    Eigen::
        MatrixXd compressed_img_g = f2.get();

    Eigen::
        MatrixXd compressed_img_b = f3.get();

    cout << "STEP 2 DONE" << endl;

    reconstruct_image(compressed_img_r, compressed_img_g, compressed_img_b);
}