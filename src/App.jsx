import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 너가 준 Gemini API 키
const genAI = new GoogleGenerativeAI("AIzaSyCeVtUfrKR9g8BZHb_dFQrLnohtO50Gs-8");

const App = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [tone, setTone] = useState("funny");
  const [pickupPrompt, setPickupPrompt] = useState("");
  const [pickupLines, setPickupLines] = useState([]);
  const [freePrompt, setFreePrompt] = useState("");
  const [freeResponses, setFreeResponses] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const extractText = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(image, "eng");
      setText(text.trim());
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePickupLine = async () => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = pickupPrompt
        ? pickupPrompt
        : `Generate a ${tone} pickup line based on the following text: ${text}`;

      const result = await model.generateContent(prompt);
      const resText = result.response.text();
      setPickupLines((prev) => [...prev, resText]);
    } catch (error) {
      console.error("Gemini Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 자유 프롬프트 (문맥 포함)
  const generateFreePromptResponse = async () => {
    if (!freePrompt) return;
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const combinedPrompt = `${freePrompt}\n\n상황:\n${text}`;
      const result = await model.generateContent(combinedPrompt);
      const resText = result.response.text();
      setFreeResponses((prev) => [...prev, resText]);
    } catch (error) {
      console.error("Free Prompt Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Wingman 💬</h1>

      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button onClick={extractText} disabled={loading}>
        OCR 텍스트 추출
      </button>

      {text && (
        <>
          <h3>📜 추출된 텍스트</h3>
          <p>{text}</p>
        </>
      )}

      <hr />

      <div>
        <h3>🎯 픽업 라인 생성</h3>
        <select value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="funny">Funny</option>
          <option value="romantic">Romantic</option>
          <option value="clever">Clever</option>
          <option value="dark">Dark</option>
        </select>
        <input
          type="text"
          placeholder="직접 픽업 프롬프트 입력"
          value={pickupPrompt}
          onChange={(e) => setPickupPrompt(e.target.value)}
        />
        <button onClick={generatePickupLine} disabled={loading}>
          생성
        </button>

        {pickupLines.map((line, idx) => (
          <p key={idx}>💌 {line}</p>
        ))}
      </div>

      <hr />

      <div>
        <h3>🧠 자유 프롬프트 (문맥 포함)</h3>
        <textarea
          rows="4"
          cols="50"
          value={freePrompt}
          placeholder="예: 이 상황에서 어색하지 않게 이어갈 답장 예시 만들어 줘."
          onChange={(e) => setFreePrompt(e.target.value)}
        />
        <button onClick={generateFreePromptResponse} disabled={loading}>
          답변 생성
        </button>

        {freeResponses.map((line, idx) => (
          <p key={idx}>🎭 {line}</p>
        ))}
      </div>
    </div>
  );
};

export default App;
