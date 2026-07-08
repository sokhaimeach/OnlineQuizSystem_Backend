module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("assignments", "total_score", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("assignments", "passing_score", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("assignments", "total_question", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("quiz_attempts", "correct_count", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("quiz_attempts", "wrong_count", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(`
      UPDATE assignments AS assignment
      INNER JOIN quizzes AS quiz ON quiz.id = assignment.quiz_id
      LEFT JOIN (
        SELECT
          quiz_id,
          COUNT(*) AS total_question,
          COALESCE(SUM(score), 0) AS total_score
        FROM questions
        GROUP BY quiz_id
      ) AS question_summary ON question_summary.quiz_id = assignment.quiz_id
      SET
        assignment.total_score = COALESCE(question_summary.total_score, 0),
        assignment.passing_score = COALESCE(quiz.passing_score, 0),
        assignment.total_question = COALESCE(question_summary.total_question, 0)
    `);

    await queryInterface.sequelize.query(`
      UPDATE quiz_attempts AS attempt
      INNER JOIN assignments AS assignment
        ON assignment.id = attempt.assignment_id
      LEFT JOIN (
        SELECT
          graded_question.attempt_id,
          SUM(graded_question.is_correct) AS correct_count
        FROM (
          SELECT
            student_answer.attempt_id,
            student_answer.question_id,
            CASE
              WHEN COUNT(DISTINCT student_answer.selected_option_id)
                    = correct_option.correct_count
                AND COUNT(
                  DISTINCT CASE
                    WHEN selected_option.is_correct = 1
                    THEN student_answer.selected_option_id
                  END
                ) = correct_option.correct_count
              THEN 1
              ELSE 0
            END AS is_correct
          FROM student_answers AS student_answer
          INNER JOIN answer_options AS selected_option
            ON selected_option.id = student_answer.selected_option_id
          INNER JOIN (
            SELECT question_id, COUNT(*) AS correct_count
            FROM answer_options
            WHERE is_correct = 1
            GROUP BY question_id
          ) AS correct_option
            ON correct_option.question_id = student_answer.question_id
          GROUP BY
            student_answer.attempt_id,
            student_answer.question_id,
            correct_option.correct_count
        ) AS graded_question
        GROUP BY graded_question.attempt_id
      ) AS result ON result.attempt_id = attempt.id
      SET
        attempt.correct_count = COALESCE(result.correct_count, 0),
        attempt.wrong_count = GREATEST(
          assignment.total_question - COALESCE(result.correct_count, 0),
          0
        )
      WHERE attempt.status <> 'IN_PROGRESS'
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("quiz_attempts", "wrong_count");
    await queryInterface.removeColumn("quiz_attempts", "correct_count");
    await queryInterface.removeColumn("assignments", "total_question");
    await queryInterface.removeColumn("assignments", "passing_score");
    await queryInterface.removeColumn("assignments", "total_score");
  },
};
