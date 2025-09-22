#!/usr/bin/env python3
"""
Management script for setting up the grading system
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gradingai.settings')
django.setup()

from submissions.models import Assignment

def create_sample_assignment():
    """Create a sample assignment for testing"""
    assignment, created = Assignment.objects.get_or_create(
        name="Assignment 1 - Basic C++ Programming",
        defaults={
            'description': 'Write a program that reads integers, sorts them, and calculates the average.',
            'max_score': 100
        }
    )
    
    if created:
        print(f"✅ Created assignment: {assignment.name}")
        
        # You'll need to manually upload the reference file through Django admin
        # or update this script to handle file uploads
        print("📝 Note: Please upload the reference answer file through Django admin")
        print(f"   Assignment ID: {assignment.id}")
    else:
        print(f"ℹ️  Assignment already exists: {assignment.name}")
    
    return assignment

def main():
    print("🚀 Setting up C++ Grading System...")
    
    try:
        # Create sample assignment
        assignment = create_sample_assignment()
        
        print("\n✅ Setup complete!")
        print(f"📋 Available assignments:")
        for ass in Assignment.objects.all():
            print(f"   - {ass.name} (ID: {ass.id})")
        
        print(f"\n🔗 Next steps:")
        print(f"1. Add Claude API key to .env file")
        print(f"2. Upload reference files through Django admin")
        print(f"3. Test file upload through React frontend")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
