module.exports = {
  async up(queryInterface, Sequelize) {
    // Foreign key indexes
    await queryInterface.addIndex("quizzes", ["teacher_id"]);
    await queryInterface.addIndex("quizzes", ["subject_id"]);

    await queryInterface.addIndex("questions", ["quiz_id"]);

    await queryInterface.addIndex("answer_options", ["question_id"]);

    await queryInterface.addIndex("assignments", ["quiz_id"]);
    await queryInterface.addIndex("assignments", ["class_id"]);

    await queryInterface.addIndex("quiz_attempts", ["assignment_id"]);
    await queryInterface.addIndex("quiz_attempts", ["student_id"]);

    await queryInterface.addIndex("student_answers", ["attempt_id"]);
    await queryInterface.addIndex("student_answers", ["question_id"]);
    await queryInterface.addIndex("student_answers", ["selected_option_id"]);

    await queryInterface.addIndex("classes", ["teacher_id"]);

    await queryInterface.addIndex("class_students", ["class_id"]);
    await queryInterface.addIndex("class_students", ["student_id"]);

    await queryInterface.addIndex("user_refresh_tokens", ["user_id"]);
    await queryInterface.addIndex("user_refresh_tokens", ["token_hash"]);

    // Composite indexes for common queries
    await queryInterface.addIndex("quiz_attempts", ["assignment_id", "student_id"], {
      name: "quiz_attempts_assignment_student",
    });

    await queryInterface.addIndex("class_students", ["class_id", "student_id"], {
      name: "class_students_class_student",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("quizzes", ["teacher_id"]);
    await queryInterface.removeIndex("quizzes", ["subject_id"]);
    await queryInterface.removeIndex("questions", ["quiz_id"]);
    await queryInterface.removeIndex("answer_options", ["question_id"]);
    await queryInterface.removeIndex("assignments", ["quiz_id"]);
    await queryInterface.removeIndex("assignments", ["class_id"]);
    await queryInterface.removeIndex("quiz_attempts", ["assignment_id"]);
    await queryInterface.removeIndex("quiz_attempts", ["student_id"]);
    await queryInterface.removeIndex("student_answers", ["attempt_id"]);
    await queryInterface.removeIndex("student_answers", ["question_id"]);
    await queryInterface.removeIndex("student_answers", ["selected_option_id"]);
    await queryInterface.removeIndex("classes", ["teacher_id"]);
    await queryInterface.removeIndex("class_students", ["class_id"]);
    await queryInterface.removeIndex("class_students", ["student_id"]);
    await queryInterface.removeIndex("quiz_attempts", "quiz_attempts_assignment_student");
    await queryInterface.removeIndex("class_students", "class_students_class_student");
  },
};
