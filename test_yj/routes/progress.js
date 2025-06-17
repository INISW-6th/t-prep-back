const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { className } = req.query;

  // 1. 진도 조회
  db.get(
    'SELECT progress FROM class WHERE class_name = ?',
    [className],
    (err, classRow) => {
      if (err) return res.status(500).json({ error: 'DB 조회 실패' });
      if (!classRow) return res.json({ prevProgress: '', nextProgress: '', progressList: [] });

      const prevProgress = classRow.progress;

      // 2. 일치하는  id 찾기
      db.get(
        'SELECT id FROM info WHERE subunit = ?',
        [prevProgress],
        (err, infoRow) => {
          if (err) return res.status(500).json({ error: 'info 조회 실패' });

          if (!infoRow) {
            return res.json({ prevProgress, nextProgress: '', progressList: [] });
          }

          const nextId = infoRow.id + 1;

          // 3. 다음 소주제
          db.get(
            'SELECT subunit FROM info WHERE id = ?',
            [nextId],
            (err, nextRow) => {
              if (err) return res.status(500).json({ error: '다음진도 조회 실패' });

              const nextProgress = nextRow ? nextRow.subunit : '';

db.all(
  'SELECT subunit FROM info WHERE id > ?', 
  [infoRow.id], 
  (err, filteredRows) => {
    if (err) return res.status(500).json({ error: '진도 목록 조회 실패' });
    const progressList = filteredRows.map(r => r.subunit);
    res.json({ prevProgress, nextProgress, progressList });
  }
);

            }
          );
        }
      );
    }
  );
});

module.exports = router;
