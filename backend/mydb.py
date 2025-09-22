#!/usr/bin/env python3
import mysql.connector
from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

try:
    # Connect to MySQL server (without specifying database)
    connection = mysql.connector.connect(
        host=os.getenv('DATABASE_HOST', 'localhost'),
        user=os.getenv('DATABASE_USER', 'root'),
        passwd=os.getenv('DATABASE_PASS', 'Ilovemilo7890$'),
        port=os.getenv('DATABASE_PORT', '3306')
    )
    
    # Prepare cursor object
    cursor = connection.cursor()
    
    # Get database name from environment
    database_name = os.getenv('DATABASE_NAME', 'cppgradingdb')
    
    # Create database if it doesn't exist
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
    
    print(f"✅ Database '{database_name}' created successfully!")
    print("🎉 Hello C++ Grading AI Database!")
    
    # Show databases to confirm
    cursor.execute("SHOW DATABASES")
    databases = cursor.fetchall()
    print("\nAvailable databases:")
    for db in databases:
        if database_name in db[0]:
            print(f"  🎯 {db[0]} (our database)")
        else:
            print(f"     {db[0]}")
            
except mysql.connector.Error as err:
    print(f"❌ Error: {err}")
    print("\nTroubleshooting:")
    print("1. Make sure MySQL server is running")
    print("2. Check your database credentials in .env file")
    print("3. Verify MySQL is installed and accessible")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)
    
finally:
    if 'connection' in locals() and connection.is_connected():
        cursor.close()
        connection.close()
        print("\n🔌 MySQL connection closed.")
