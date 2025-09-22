/////////////////////////////////////////////////////////////////////
//
// Name: Esteban Zavala
// Date: 1/27/23
// Class: 1470.06
// Semester: Spring 2023
// CSCI 1470 Instructor: Gustavo Dietrich 
//
// Program Name: Magic Number
// Program Description: Calculate a person's magic number based on 
//      their birthday.
//
/////////////////////////////////////////////////////////////////////

#include<iostream>
#include <typeinfo>   // operator typeid

using namespace std;

// Ignore this; it's a little function used for making tests
inline void _test(const char* expression, const char* file, int line)
{
	cerr << "test(" << expression << ") failed in file " << file;
	cerr << ", line " << line << "." << endl << endl;
	//abort();
}
// This goes along with the above function...don't worry about it
#define test(EXPRESSION) ((EXPRESSION) ? (void)0 : _test(#EXPRESSION, __FILE__, __LINE__))


int main()
{
// Declare variables called day, month, year, and magicNum that hold whole numbers. Initialize them with data 
// corresponding to January 31, 1970. Do not initialize magicNum
  int day = 31;
  int month = 1;
  int year = 1970;
  int magicNum;
// Using the provided equation , calculate the magic number for the given birthday and store the result in  magicNum
	magicNum = (month * year) % day; 
  

	test(magicNum == 17);	// Do NOT remove or modify this statement

// Using the variables, print out the given initial birthday and its corresponding magic number.
  cout << "The magic number for " << month << '-' << day << '-' << year << " is: " << magicNum << endl << endl;
// Prompt the user to enter her/his birthdate as 3 whole numbers
  cout << "Please enter your birthdate as 3 whole numbers (MM DD YYYY): " ;
// Get the values from the keyboard and store them in the corresponding variables
  cin >> month >> day >> year;
// Using the provided equation , calculate the magic number for the entered birthdate and store the result in  magicNum
  magicNum = (month * year) % day; 
// Using the variables, print out the entered birthdate and its corresponding magic number.
  cout << "The magic number for " << month << '-' << day << '-' << year << " is: " << magicNum << endl << endl;

// Do NOT remove or modify the following statements
	cout << endl << "Testing your solution" << endl << endl;
	test(typeid(day) == typeid(int));		// Incorrect data type used for day
	test(typeid(month) == typeid(int));		// Incorrect data type used for month
	test(typeid(year) == typeid(int));		// Incorrect data type used for year
	test(typeid(magicNum) == typeid(int));	// Incorrect data type used for magicNum

	return 0;
}