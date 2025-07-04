// index.js
require("dotenv").config();
// 1. 필요한 모듈 가져오기
const express = require("express");
const axios = require("axios"); // LLM API 호출을 위해 axios 추가
require("dotenv").config(); // .env 파일 사용을 위해 dotenv 추가

// 2. Express 앱 생성 및 설정
const app = express();
const port = 5000; // 서버가 실행될 포트

// 3. Express에 내장된 미들웨어를 사용하여 요청 본문(body)의 JSON을 파싱
app.use(express.json());

// CORS(Cross-Origin Resource Sharing) 설정 추가
// 프론트엔드(HTML)와 백엔드(서버)가 다른 주소에서 실행될 때 필요합니다.
const cors = require("cors");
app.use(cors());
app.use(express.static("public"));
/**
 * API 엔드포인트: POST /generate-link
 * 요청 본문(Request Body)으로 장면 데이터를 받아 공유 링크를 생성하여 반환합니다.
 * (기존 기능은 그대로 유지)
 */
app.post("/generate-link", (req, res) => {
  // 4. 요청 본문에서 'scenes'와 'viewerUrl' 데이터 추출
  const { scenes, viewerUrl } = req.body;

  // 5. 필수 데이터가 있는지 확인 (유효성 검사)
  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return res.status(400).json({
      error: "요청 본문에 'scenes' 배열이 필요합니다.",
    });
  }
  if (!viewerUrl || typeof viewerUrl !== "string") {
    return res.status(400).json({
      error: "요청 본문에 'viewerUrl' 문자열이 필요합니다.",
    });
  }

  try {
    // 6. 공유 링크 생성 로직
    const dataToEncode = { scenes: scenes };
    const jsonString = JSON.stringify(dataToEncode);
    const base64String = Buffer.from(jsonString).toString("base64");
    const urlSafeBase64String = encodeURIComponent(base64String);
    const shareableLink = `${viewerUrl}?data=${urlSafeBase64String}`;

    // 7. 성공 응답으로 생성된 링크를 JSON 형태로 반환
    console.log("링크 생성 성공:", shareableLink);
    res.status(200).json({
      success: true,
      shareLink: shareableLink,
    });
  } catch (error) {
    // 8. 서버 내부 오류 처리
    console.error("링크 생성 중 오류 발생:", error);
    res.status(500).json({
      success: false,
      error: "서버 내부 오류가 발생했습니다.",
    });
  }
});

// ====================================================================
// ===================   새로 추가된 채팅 API   =======================
// ====================================================================

/**
 * API 엔드포인트: POST /chat
 * 프론트엔드에서 보낸 질문을 받아 직접 만드신 LLM에게 전달하고,
 * 그 답변을 다시 프론트엔드로 보내줍니다.
 */
app.post("/chat", async (req, res) => {
  // 1. 프론트엔드에서 보낸 질문과 캐릭터 정보 추출
  const { question, character } = req.body;

  if (!question) {
    return res
      .status(400)
      .json({ error: "질문(question) 데이터가 필요합니다." });
  }

  // 2. OpenAI API 키를 .env 파일에서 불러오기 (변수명 변경 권장)
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: "OpenAI API 키가 서버에 설정되지 않았습니다." });
  }

  // OpenAI API 엔드포인트 주소
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

  try {
    // 3. GPT에게 보낼 요청 데이터 구성 (OpenAI API 명세에 맞게 수정)
    const requestData = {
      model: "gpt-3.5-turbo", // 또는 "gpt-3.5-turbo", "gpt-4-turbo" 등 원하는 모델 사용
      messages: [
        {
          role: "system",
          // 시스템 메시지를 통해 캐릭터의 역할을 명확하게 부여합니다.
          content: `너는 이제부터 '${character}'라는 캐릭터야. 모든 답변을 '${character}'의 말투, 성격, 세계관을 완벽하게 반영해서 대답해야 해.`,
        },
        {
          role: "user",
          content: question,
        },
      ],
      // max_tokens: 150, // 필요에 따라 답변 최대 길이 등 다른 파라미터 추가
      // temperature: 0.7, // 창의성 조절
    };

    // 4. axios를 사용해 OpenAI 서버에 API 요청 보내기
    const llmResponse = await axios.post(OPENAI_API_URL, requestData, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // 5. GPT의 응답에서 답변 텍스트 추출 (응답 형식에 맞게 수정)
    const answer = llmResponse.data.choices[0].message.content.trim();

    // 6. 프론트엔드로 최종 답변 전송
    res.json({ success: true, answer: answer });
  } catch (error) {
    // 7. API 호출 중 에러 처리
    console.error(
      "OpenAI API 호출 오류:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ success: false, error: "AI가 답변을 생성하는 데 실패했습니다." });
  }
});
// 9. 지정된 포트에서 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log("링크 생성은 POST http://localhost:3000/generate-link");
  console.log("채팅 요청은 POST http://localhost:3000/chat");
});
