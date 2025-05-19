import React, { useState } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";

const App = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [tone, setTone] = useState("funny");
  const [customPrompt, setCustomPrompt] = useState("");
  const [response, setResponse] = useState([]);
  const [pickupPrompt, setPickupPrompt] = useState("");
  const [pickupLines, setPickupLines] = useState([]);
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
      } = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });
      setText(text);
    } catch (err) {
      console.error("❌ OCR 실패:", err);
      alert("OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const generateReply = async () => {
    if (!text) {
      alert("먼저 OCR 실행해서 텍스트를 추출해주세요!");
      setLoading(false);
      return;
    }

    setLoading(true);

    const style = tone === "custom" ? customPrompt : tone;
    const prompt = `상대방이 이렇게 말했다: "${text.trim()}"
나는 ${style} 스타일로 멋지게 대답하려고 한다. 어떤 말을 해야 매력 있어 보일까?`;

    try {
      const result = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          n: 3,
        },
        {
          headers: {
            Authorization: `Bearer sk-여기에_개인_키_붙이기`,
            "Content-Type": "application/json",
          },
        }
      );

      setResponse(result.data.choices.map(c => c.message.content));
    } catch (err) {
      console.error("❌ GPT 오류:", err);
      alert("GPT 호출 중 문제가 발생했어. Console 로그를 확인해줘.");
    } finally {
      setLoading(false);
    }
  };

  const generatePickupLines = async () => {
    if (!pickupPrompt) return;
    setLoading(true);

    const prompt = `다음 상황에서 센스 있고 유쾌하게 대화를 시작할 수 있는 픽업 라인을 3개 만들어줘.\n상황: ${pickupPrompt}`;

    try {
      const result = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
        },
        {
          headers: {
            Authorization: `Bearer sk-여기에_개인_키_붙이기`,
            "Content-Type": "application/json",
          },
        }
      );

      const lines = result.data.choices[0].message.content.split("\n").filter(line => line.trim() !== "");
      setPickupLines(lines);
    } catch (err) {
      console.error("❌ 픽업 라인 생성 오류:", err);
      alert("픽업 라인 생성 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧠 Wingman</h1>

      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button onClick={extractText} className="mt-2 p-2 bg-blue-500 text-white rounded">
        OCR 실행
      </button>

      {text && <div className="my-4 p-2 border">📜 추출된 텍스트: {text}</div>}

      <select value={tone} onChange={(e) => setTone(e.target.value)} className="mb-2">
        <option value="funny">😆 유머</option>
        <option value="sweet">💘 로맨틱</option>
        <option value="cool">😎 쿨하게</option>
        <option value="honest">🧐 진지하게</option>
        <option value="custom">✍️ 사용자 정의</option>
      </select>

      {tone === "custom" && (
        <input
          type="text"
          placeholder="예: 반말로, 장난스럽게"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="mb-2 p-2 w-full border rounded"
        />
      )}

      <button onClick={generateReply} className="p-2 bg-green-500 text-white rounded">
        GPT 답변 생성
      </button>

      {loading && <p>처리 중...</p>}

      {response.length > 0 && (
        <div className="mt-4 p-2 border">
          {response.map((r, idx) => (
            <div key={idx} className="mb-3 p-2 bg-gray-100 rounded">
              <p>🤖 GPT 응답 {idx + 1}: {r}</p>
              <button
                onClick={() => navigator.clipboard.writeText(r)}
                className="mt-1 text-sm text-white bg-gray-700 rounded px-3 py-1"
              >
                복사
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">🎯 픽업 라인 생성기</h2>
        <input
          type="text"
          placeholder="예: 소개팅에서 처음 말 걸 때"
          value={pickupPrompt}
          onChange={(e) => setPickupPrompt(e.target.value)}
          className="mb-2 p-2 w-full border rounded"
        />
        <button onClick={generatePickupLines} className="p-2 bg-purple-500 text-white rounded">
          픽업 라인 생성
        </button>

        {pickupLines.length > 0 && (
          <div className="mt-4 p-2 border">
            {pickupLines.map((line, idx) => (
              <div key={idx} className="mb-3 p-2 bg-violet-100 rounded">
                <p>💬 {line}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(line)}
                  className="mt-1 text-sm text-white bg-gray-700 rounded px-3 py-1"
                >
                  복사
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
