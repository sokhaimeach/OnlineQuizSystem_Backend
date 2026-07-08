# API Endpoints

Base URL: `http://localhost:3000/api/v1`

---

## Auth

| Method | Endpoint | Description | Validation / Notes |
|---|---|---|---|
| POST | `http://localhost:3000/api/v1/auth/register` | Register a new user | `userValidator.create` |
| POST | `http://localhost:3000/api/v1/auth/login` | Login user | `loginLimiter`, `userValidator.login` |
| DELETE | `http://localhost:3000/api/v1/auth/logout` | Logout user | No validation |
| POST | `http://localhost:3000/api/v1/auth/refresh` | Refresh auth token | `validateCookie` |

---

## Teacher (requires auth + `TEACHER` role)

### Subjects

| Method | Endpoint | Description | Validation |
|---|---|---|---|
| POST | `http://localhost:3000/api/v1/teacher/subjects` | Create a subject | `subjectValidator.create` |
| PUT | `http://localhost:3000/api/v1/teacher/subjects/:id` | Update a subject | `subjectValidator.update`, `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/subjects` | Get all subjects | No validation |
| DELETE | `http://localhost:3000/api/v1/teacher/subjects/:id` | Delete a subject | `uuidParamSchema` |

### Classes

| Method | Endpoint | Description | Validation |
|---|---|---|---|
| POST | `http://localhost:3000/api/v1/teacher/classes` | Create a class | `classValidator.create` |
| PUT | `http://localhost:3000/api/v1/teacher/classes/:id` | Update a class | `classValidator.update`, `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/classes` | Get all classes | No validation |
| DELETE | `http://localhost:3000/api/v1/teacher/classes/:id` | Delete a class | `uuidParamSchema` |

### Quizzes

| Method | Endpoint | Description | Validation |
|---|---|---|---|
| POST | `http://localhost:3000/api/v1/teacher/quizzes` | Create a quiz | `quizValidator.create` |
| PUT | `http://localhost:3000/api/v1/teacher/quizzes/:id` | Update a quiz | `quizValidator.update`, `uuidParamSchema` |
| DELETE | `http://localhost:3000/api/v1/teacher/quizzes/:id` | Delete a quiz | `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/quizzes` | Get all quizzes | `paginationSchema` query |
| GET | `http://localhost:3000/api/v1/teacher/quizzes/:id` | Get quiz by ID | `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/quizzes/:id/quizzes-by-subject` | Get quizzes by subject ID | `uuidParamSchema`, `paginationSchema` query |
| PUT | `http://localhost:3000/api/v1/teacher/quizzes/questions/:id` | Update a question on a quiz | `questionValidator.update`, `uuidParamSchema` |
| DELETE | `http://localhost:3000/api/v1/teacher/quizzes/questions/:id` | Delete a question on a quiz | `uuidParamSchema` |

### Assignments

| Method | Endpoint | Description | Validation |
|---|---|---|---|
| POST | `http://localhost:3000/api/v1/teacher/assignments` | Create an assignment | `assignmentValidator.create` |
| PUT | `http://localhost:3000/api/v1/teacher/assignments/:id` | Update an assignment | `assignmentValidator.update`, `uuidParamSchema` |
| DELETE | `http://localhost:3000/api/v1/teacher/assignments/:id` | Delete an assignment | `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/assignments/:id/assignments-by-class` | Get assignments by class ID | `uuidParamSchema`, `paginationSchema` query |

### Students

| Method | Endpoint | Description | Validation |
|---|---|---|---|
| GET | `http://localhost:3000/api/v1/teacher/students/:id/class` | Get students in a class | `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/students/:id` | Get student by ID | `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/students/:id/attempts-histories` | Get student attempt histories | `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/teacher/students/attempts/:id` | Get student attempt detail | `uuidParamSchema` |

### Questions

The teacher router mounts `/teacher/questions`, contains in `src/routes/teacher/quizzes.route.js`

---

## Student

### Classes

| Method | Endpoint | Description | Validation |
|---|---|---|---|
| POST | `http://localhost:3000/api/v1/student/classes/:id/join` | Join a class | `uuidParamSchema` |
| GET | `http://localhost:3000/api/v1/student/classes` | Get classes for the current student | No validation |
| GET | `http://localhost:3000/api/v1/student/classes/:id/attempts` | Get quiz attempts by class ID | `uuidParamSchema` |

### Quiz Attempts

| Method | Endpoint | Description | Validation |
|---|---|---|---|
| POST | `http://localhost:3000/api/v1/student/attempts` | Create a quiz attempt | `quizAttemptValidator.create` |
| GET | `http://localhost:3000/api/v1/student/attempts/:id/quiz` | Get quiz details for a student attempt | `uuidParamSchema`, `attemptAccess` |
| POST | `http://localhost:3000/api/v1/student/attempts/:id/submit` | Submit quiz answers | `studentAnswerValidator.submit`, `uuidParamSchema`, `attemptAccess` |
| GET | `http://localhost:3000/api/v1/student/attempts/:id/result` | Get quiz result by attempt ID | `uuidParamSchema`, `attemptAccess` |

---

## Notes

- All teacher endpoints are protected by authentication and the `TEACHER` role.
- Student endpoints use authentication and the `STUDENT` role where shown in route middleware.
- `optionalAuth` is applied to `/student/attempts` routes, meaning the attempt routes may accept requests with or without authentication depending on implementation.
