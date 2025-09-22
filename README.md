# AI-Powered C++ Grading System

An intelligent grading system that automates the evaluation of C++ programming assignments using AI. This full-stack application provides comprehensive code analysis, automatic grading, and detailed feedback for educational institutions.

## Project Overview

This system combines modern web technologies with AI to streamline the grading process for C++ assignments. Instructors can upload reference solutions and students can submit their code for automatic evaluation with detailed analysis and scoring.

### Key Features

- **Automated Code Grading**: AI-powered evaluation of C++ submissions against reference solutions
- **Comprehensive Analysis**: Detailed feedback on code quality, correctness, and style
- **File Upload Management**: Secure handling of student submissions and reference answers
- **Real-time Results**: Instant grading results with detailed analysis reports
- **Analytics Dashboard**: Track submission patterns and grading statistics
- **Tool Integration**: Advanced analysis tools for code evaluation

## Technology Stack

### Backend
- **Django** - Python web framework with REST API
- **Django REST Framework** - API development
- **MySQL** - Database for persistent storage
- **OpenAI API** - AI-powered grading intelligence
- **Anthropic Claude** - Advanced code analysis

### Frontend
- **React** - Modern JavaScript UI library
- **TypeScript** - Type-safe JavaScript development
- **Styled Components** - CSS-in-JS styling
- **Axios** - HTTP client for API communication

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 16+
- MySQL 8.0+
- OpenAI API access

### Backend Setup

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv virt
   source virt/bin/activate  # On Windows: virt\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Required
   SECRET_KEY=your_django_secret_key
   DATABASE_PASS=your_mysql_password
   OPENAI_API_KEY=your_openai_api_key
   
   # Optional (with defaults)
   DEBUG=True
   DATABASE_NAME=cppgradingdb
   DATABASE_USER=root
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   ```

5. **Setup database:**
   ```bash
   # Create database
   python mydb.py
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   ```

6. **Start the backend server:**
   ```bash
   python manage.py runserver 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key for security | `your-secret-key-here` |
| `DATABASE_PASS` | MySQL database password | `your-mysql-password` |
| `OPENAI_API_KEY` | OpenAI API key for AI grading | `sk-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable Django debug mode | `True` |
| `DATABASE_NAME` | MySQL database name | `cppgradingdb` |
| `DATABASE_USER` | MySQL username | `root` |
| `DATABASE_HOST` | Database host | `localhost` |
| `DATABASE_PORT` | Database port | `3306` |
| `CORS_ALLOWED_ORIGINS` | Frontend URL for CORS | `http://localhost:3000` |
| `MAX_CODE_SIZE_KB` | Maximum code file size | `500` |
| `DEFAULT_TIMEOUT_SECONDS` | AI processing timeout | `30` |

## Usage Guide

### For Instructors

1. **Upload Reference Solutions**: Navigate to the upload page and provide reference C++ solutions
2. **Configure Grading Criteria**: Set up evaluation parameters and weight assignments
3. **Review Results**: Monitor student submissions and review AI-generated grades
4. **Analytics**: Track class performance and identify common issues

### For Students

1. **Submit Assignments**: Upload your C++ code files through the submission interface
2. **View Results**: Get instant feedback with detailed analysis of your code
3. **Understand Feedback**: Review suggestions for improvement and correctness issues

## Project Structure

```
gradingAi/
├── backend/                    # Django REST API
│   ├── gradingai/             # Main Django project
│   ├── submissions/           # Student submission handling
│   ├── grading/              # AI grading logic and tools
│   ├── authentication/       # User authentication
│   ├── analytics/            # Statistics and reporting
│   ├── media/               # File uploads storage
│   ├── requirements.txt     # Python dependencies
│   └── manage.py           # Django management
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API communication
│   │   └── styles/         # CSS and styling
│   ├── package.json        # Node.js dependencies
│   └── public/            # Static assets
├── .gitignore             # Git ignore rules
└── README.md             # Project documentation
```

## API Endpoints

The backend provides a RESTful API with the following main endpoints:

### Submissions
- `POST /api/submissions/upload/` - Upload student code
- `GET /api/submissions/` - List all submissions
- `GET /api/submissions/{id}/` - Get specific submission details

### Grading
- `POST /api/grading/grade/{id}/` - Grade a submission
- `GET /api/grading/results/{id}/` - Get grading results
- `GET /api/grading/tools/analyze/` - Advanced code analysis

### Analytics
- `GET /api/analytics/` - Get grading statistics
- `GET /api/analytics/submissions/` - Submission analytics

## Development

### Running Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests  
cd frontend
npm test
```

### Database Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Code Quality
- Follow PEP 8 for Python code
- Use TypeScript strict mode for frontend
- Run linting before commits
- Write comprehensive tests for new features

## Security Considerations

- Environment variables are required for API keys and sensitive data
- File uploads are validated and size-limited
- CORS is configured for frontend-backend communication
- Database credentials are environment-based
- Production settings disable debug mode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

- **Database Connection**: Ensure MySQL is running and credentials are correct
- **API Key Errors**: Verify OpenAI API key is valid and has sufficient credits
- **File Upload Issues**: Check file size limits and media directory permissions
- **CORS Errors**: Confirm frontend URL is in `CORS_ALLOWED_ORIGINS`

### Getting Help

- Check the Django admin panel for database issues
- Review server logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed

## License

This project is licensed under the MIT License - see the LICENSE file for details.
