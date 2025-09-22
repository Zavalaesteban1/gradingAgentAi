# C++ Grading AI - Backend

Django REST API backend for the AI-powered C++ code grading system.

## Quick Setup

### 1. Environment Setup
```bash
# Create and activate virtual environment
python3 -m venv virt
source virt/bin/activate  # On Windows: virt\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables
Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

**Required Environment Variables:**
- `SECRET_KEY` - Django secret key
- `DATABASE_PASS` - Your MySQL password 
- `OPENAI_API_KEY` - Your OpenAI API key (get from https://platform.openai.com/api-keys)

### 3. Database Setup
```bash
# Make sure MySQL is running and create database
python mydb.py

# Run Django migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. Run Server
```bash
python manage.py runserver 8000
```

## Project Structure

```
backend/
├── gradingai/          # Main Django project
│   ├── settings.py     # Configuration (uses .env)
│   ├── urls.py         # Main URL routing
│   └── wsgi.py         # WSGI application
├── submissions/        # Student submission handling
├── grading/           # AI grading logic
├── analytics/         # Statistics and reporting
├── reference_answers/ # Reference C++ solutions
├── media/            # Uploaded files storage
│   └── submissions/  # Student code files
├── mydb.py           # Database creation script
├── requirements.txt  # Python dependencies
├── .env              # Environment variables (not in git)
└── .env.example      # Environment template
```

## API Endpoints

Once models and views are created, the API will provide:

- `POST /api/submissions/upload/` - Upload student code
- `GET /api/submissions/` - List submissions
- `POST /api/grading/grade/{id}/` - Grade submission
- `GET /api/analytics/` - Get grading statistics

## Development

### Adding New Apps
```bash
python manage.py startapp appname
```

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Testing Configuration
```bash
python manage.py check
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | **Required** |
| `DEBUG` | Debug mode | `True` |
| `DATABASE_NAME` | MySQL database name | `cppgradingdb` |
| `DATABASE_USER` | MySQL username | `root` |
| `DATABASE_PASS` | MySQL password | **Required** |
| `DATABASE_HOST` | MySQL host | `localhost` |
| `DATABASE_PORT` | MySQL port | `3306` |
| `OPENAI_API_KEY` | OpenAI API key | **Required** |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend URLs | `http://localhost:3000` |
| `ALLOWED_HOSTS` | Django allowed hosts | `localhost,127.0.0.1` |
| `FILE_UPLOAD_MAX_MEMORY_SIZE` | Max file size (bytes) | `5242880` (5MB) |
| `MAX_CODE_SIZE_KB` | Max code file size | `500` |
| `DEFAULT_TIMEOUT_SECONDS` | AI grading timeout | `30` |
| `PAGE_SIZE` | API pagination size | `20` |

## Security Notes

- Never commit `.env` file to git
- Use strong `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Configure proper `ALLOWED_HOSTS` for production
