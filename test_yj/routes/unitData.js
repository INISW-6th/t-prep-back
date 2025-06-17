const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { grade, unit } = req.query;

  db.get(
    `SELECT goal FROM guide WHERE grade = ? AND unit = ?`,
    [grade, unit],
    (err, guideRow) => {
      if (err) return res.status(500).json({ error: '지도서DB 조회 실패' });

      db.get(
        `SELECT subtopics FROM textbook WHERE grade = ? AND unit = ?`,
        [grade, unit],
        (err, textRow) => {
          if (err) return res.status(500).json({ error: '교과서DB 조회 실패' });

          let subTopics = [];
          if (textRow && textRow.subtopics) {
            try {
              subTopics = JSON.parse(textRow.subtopics);
            } catch (e) {
              subTopics = [];
            }
          }

          res.json({
            previousSummary: "이전 수업 요약 테스트",
            todayGoal: guideRow?.goal || '',
            todaySummary: "오늘의 요약 테스트",
            subTopics
          });
        }
      );
    }
  );
});

module.exports = router;
