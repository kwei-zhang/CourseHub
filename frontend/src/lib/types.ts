export type Resource = {
  id: string;
  title: string;
  courseCode: string;
  contentType: string;
  objectKey: string;
  policy: string;
  tags: string[];
  uploaderId: string;
};

export type CourseEnrollment = {
  course_id: string;
  course_code: string;
  course_name: string;
  role: string;
};
