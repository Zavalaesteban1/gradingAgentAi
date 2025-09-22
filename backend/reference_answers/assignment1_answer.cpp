#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

/**
 * Assignment 1: Basic C++ Programming - Sorting Algorithm
 * 
 * Write a program that:
 * 1. Reads a list of integers from user input
 * 2. Sorts them in ascending order
 * 3. Displays the sorted list
 * 4. Calculates and displays the average
 */

int main() {
    vector<int> numbers;
    int num;
    int count = 0;
    
    cout << "Enter integers (enter -999 to stop): " << endl;
    
    // Read numbers from user
    while (cin >> num && num != -999) {
        numbers.push_back(num);
        count++;
    }
    
    if (numbers.empty()) {
        cout << "No numbers entered." << endl;
        return 0;
    }
    
    // Sort the numbers
    sort(numbers.begin(), numbers.end());
    
    // Display sorted numbers
    cout << "Sorted numbers: ";
    for (int i = 0; i < numbers.size(); i++) {
        cout << numbers[i];
        if (i < numbers.size() - 1) {
            cout << " ";
        }
    }
    cout << endl;
    
    // Calculate and display average
    double sum = 0;
    for (int num : numbers) {
        sum += num;
    }
    double average = sum / numbers.size();
    
    cout << "Average: " << average << endl;
    cout << "Count: " << numbers.size() << endl;
    
    return 0;
}
