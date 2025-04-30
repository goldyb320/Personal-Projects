// FPSGameOne.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>
#include <chrono>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;



#include <Windows.h>

int nScreenWidth = 120;
int nScreenHeight = 40;

//player location
float fPlayerX = 8.0f;
float fPlayerY = 8.0f;
float fPlayerA = 0.0f;

//Map Stuff
int nMapHeight = 16;
int nMapWidth = 16;

float fFov = 3.14159 / 4.0;

float fDepth = 16.0f;


int main()
{
    //Makes console and assigns it to the size of height and width
    wchar_t* screen = new wchar_t[nScreenWidth * nScreenHeight];
    HANDLE hConsole = CreateConsoleScreenBuffer(GENERIC_READ | GENERIC_WRITE, 0, NULL, CONSOLE_TEXTMODE_BUFFER, NULL);
    SetConsoleActiveScreenBuffer(hConsole);
    DWORD dwBytesWritten = 0;

    //String for map and its structure, it is a 16X16 as we defined in our width and height variables above
    wstring map;

    map += L"################";
    map += L"#..............#";
    map += L"#..............#";
    map += L"#..............#";
    map += L"#..........#...#";
    map += L"#..........#...#";
    map += L"#..............#";
    map += L"#..............#";
    map += L"#..............#";
    map += L"#..............#";
    map += L"#..............#";
    map += L"#........#######";
    map += L"#..............#";
    map += L"#..............#";
    map += L"#..............#";
    map += L"################";

    auto tp1 = chrono::system_clock::now();
    auto tp2 = chrono::system_clock::now();


    //Game Loop
    while (1)
    {
        //time
        auto tp2 = chrono::system_clock::now();
        chrono::duration<float> elapsedTime = tp2 - tp1;
        tp1 = tp2;
        float fElapsedTime = elapsedTime.count();



        //controls, this does CCW Rotation
        if (GetAsyncKeyState((unsigned short)'A') & 0x8000)
        {
            fPlayerA -= (0.8f) * fElapsedTime;
        }

        if (GetAsyncKeyState((unsigned short)'D') & 0x8000)
        {
            fPlayerA += (0.8f) * fElapsedTime;
        }

        if (GetAsyncKeyState((unsigned short)'W') & 0x8000)
        {
            fPlayerX += sinf(fPlayerA) * 5.0f * fElapsedTime;
            fPlayerY += cosf(fPlayerA) * 5.0f * fElapsedTime;

            if (map[(int)fPlayerY * nMapWidth + (int)fPlayerX] == '#')//lets us undo our last action if we have hit a wall
            {
                fPlayerX -= sinf(fPlayerA) * 5.0f * fElapsedTime;
                fPlayerY -= cosf(fPlayerA) * 5.0f * fElapsedTime;
            }
        }

        if (GetAsyncKeyState((unsigned short)'S') & 0x8000)
        {
            fPlayerX -= sinf(fPlayerA) * 5.0f * fElapsedTime;
            fPlayerY -= cosf(fPlayerA) * 5.0f * fElapsedTime;

            if (map[(int)fPlayerY * nMapWidth + (int)fPlayerX] == '#')
            {
                fPlayerX += sinf(fPlayerA) * 5.0f * fElapsedTime;
                fPlayerY += cosf(fPlayerA) * 5.0f * fElapsedTime;
            }
        }

        //goes through each column to get an array of distances away, while looking
        for (int x = 0; x < nScreenWidth; x++)
        {
            //takes player angle and tries to find out starting angle for the fFov, chops to little bits
            float fRayAngle = (fPlayerA - fFov / 2.0f) + ((float)x / (float)nScreenWidth) * fFov;

            //we'll test distance in little increments till we see a wall
            float fDistanceToWall = 0;
            bool bHitWall = false;
            bool bBoundary = false;

            float fEyeX = sinf(fRayAngle); //unit vector for direction player is looking in
            float fEyeY = cosf(fRayAngle);

            while (!bHitWall && fDistanceToWall < fDepth)
            {
                fDistanceToWall += 0.1f;

                int nTestX = (int)(fPlayerX + fEyeX * fDistanceToWall);
                int nTestY = (int)(fPlayerY + fEyeY * fDistanceToWall);

                if (nTestX < 0 || nTestX >= nMapWidth || nTestY < 0 || nTestY >= nMapHeight)
                {
                    bHitWall = true;            //max depth distance is set
                    fDistanceToWall = fDepth;
                }
                else
                {
                    if (map[nTestY * nMapWidth + nTestX] == '#')
                    {
                        bHitWall = true;


                        //CORNER DETECTION!!!
                        vector<pair<float, float>> p;

                        for (int j = 0; j < 2; j++)
                        {
                            for (int k = 0; k < 2; k++)
                            {
                                float py = (float)nTestY + k - fPlayerY;
                                float px = (float)nTestX + j - fPlayerX;
                                float d = sqrt(py * py + px * px);
                                float dot = (fEyeX * px / d) + (fEyeY * py / d);
                                p.push_back(make_pair(d, dot));
                            }
                        }
                        //sort pairs from closest to farthest
                        sort(p.begin(), p.end(), [](const pair<float, float> &left, const pair<float, float> &right) {return left.first < right.first; });

                        float fBound = 0.01;


                        //takes inverse cosine of dot product to get the angle between the two rays, if it's less than boundary then it hits boundaries of the cell
                        if (acos(p.at(0).second) < fBound)
                        {
                            bBoundary = true;
                        }
                        if (acos(p.at(1).second) < fBound)
                        {
                            bBoundary = true;
                        }
                        if (acos(p.at(2).second) < fBound)
                        {
                            bBoundary = true;
                        }


                    }
                }
            }

            int nCeiling = (float)(nScreenHeight / 2.0) - nScreenHeight / ((float)fDistanceToWall);
            int nFloor = nScreenHeight - nCeiling;




            //takes care of all shading using unicode characters
            short nShade = ' ';

            if (fDistanceToWall <= fDepth / 4.0f)
            {
                nShade = 0x2588;                        //SUPER CLOSE
            }
            else if (fDistanceToWall < fDepth / 3.0f)
            {
                nShade = 0x2593;
            }
            else if (fDistanceToWall < fDepth / 2.0f)
            {
                nShade = 0x2592;
            }
            else if (fDistanceToWall < fDepth)
            {
                nShade = 0x2591;
            }
            else
            {
                nShade = ' ';                           //SUPER FAR
            }

            if (bBoundary)
            {
                nShade = ' '; //make it black if we hit a boundary
            }

            for (int y = 0; y < nScreenHeight; y++)
            {
                if (y <= nCeiling)
                {
                    screen[y * nScreenWidth + x] = ' ';
                }
                else if(y > nCeiling && y <= nFloor)
                {
                    screen[y * nScreenWidth + x] = nShade;
                }
                else
                {
                    float b = 1.0f - (((float)y - nScreenHeight / 2.0f) / ((float)nScreenHeight / 2.0f));

                    if (b < 0.25)
                    {
                        nShade = '#';
                    }
                    else if (b < 0.5)
                    {
                        nShade = 'x';
                    }
                    else if (b < 0.75)
                    {
                       nShade = '.';
                    }
                    else if (b < 0.9)
                    {
                       nShade = '-';
                    }
                    else
                    {
                        nShade = ' ';
                    }
                    screen[y*nScreenWidth + x] = nShade;
                }
            }


        }
        //display stats and a map!!!!!

        wprintf_s(screen, 40, L"x=%3.2f, Y=%3.2f, A=%3.2f FPS=%3.2f ", fPlayerX, fPlayerY, fPlayerA, 1.0f / fElapsedTime);

        //display it
        for (int q = 0; q < nMapWidth; q++)
        {
            for (int m = 0; m < nMapHeight; m++)
            {
                screen[(m + 1) * nScreenWidth + q] = map[m * nMapWidth + q];
            }
        }
        //this shows where the player is
        screen[((int)fPlayerY + 1) * nScreenWidth + (int)fPlayerX] = 'P';


        //last chracter is the escape character, we tell the console the buffer and how many bytes and the coordinates of where it is to be written
        screen[nScreenWidth * nScreenHeight - 1] = '\0';
        WriteConsoleOutputCharacter(hConsole, screen, nScreenWidth * nScreenHeight, { 0,0 }, &dwBytesWritten);
    }

    

    return 0;
}

