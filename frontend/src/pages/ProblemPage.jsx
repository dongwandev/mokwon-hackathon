import { useState } from 'react'

const ProblemPage = () => {
  const question = {
    text: "나는 지금 __을 하고 있다",
    choices: ["음식", "게임", "치킨", "피자"],
    answer: 1
  }

  const [selected, setSelected] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)

  const handleAnswer = (index) => {
    if (selected !== null) return // 이미 선택했으면 막기
    setSelected(index)
    setIsCorrect(index === question.answer)
  }

  return (
    <div className="p-10 max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-6">🛠️ 관리자 문제 풀이</h2>

      <div className="bg-white p-6 rounded shadow">
        <p className="text-lg font-medium mb-4">{question.text}</p>
        <div className="flex flex-col gap-3">
          {question.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={selected !== null}
              className={`
                px-4 py-2 rounded border
                ${selected === index ? (
                  index === question.answer ? "bg-green-200 border-green-500" : "bg-red-200 border-red-500"
                ) : "hover:bg-gray-100"}
              `}
            >
              {choice}
            </button>
          ))}
        </div>

        {selected !== null && (
          <p className="mt-6 text-lg font-semibold">
            {isCorrect ? "✅ 정답입니다!" : "❌ 오답입니다!"}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProblemPage
