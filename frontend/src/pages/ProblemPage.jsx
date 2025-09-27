import { useState } from 'react'

const quizData = [
  {
    text: "나는__을 하고있다",
    choices: ["집", "게임", "피", "컴퓨터"],
    answer: 1
  },
  {
    text: "나는__을 먹는다",
    choices: ["집", "체스", "피자", "컴퓨터"],
    answer: 2
  },
  {
    text: "나는__을 입고있다",
    choices: ["치킨", "컴퓨터", "책상", "셔츠"],
    answer: 3
  },
  {
    text: "__는 노랗다",
    choices: ["바나나", "사과", "단풍잎", "콜라"],
    answer: 0
  },
  {
    text: "바다에서 물고기를 잡을때 타는 배는?",
    choices: ["어선 또는 낚시배", "화물선", "유조선", "예인선"],
    answer: 0
  },
  {
    text: "목이 아플때 가는 병원은?",
    choices: ["정형외과", "외과", "이비인후과", "안과"],
    answer: 2
  },
  {
    text: "한국에서 일반적으로 랩탑을 의미하는 말로 적절한것은? ",
    choices: ["컴퓨터", "휴대폰", "노트북", "자동차"],
    answer: 2
  },
  {
    text: "다음중 현재진행형 문장을 고르시오",
    choices: ["나는 밥을 먹었다", "나는 밥을 먹는중이다", "나는 밥을 먹을것이다", "나는 밥을 먹었었다"],
    answer: 1
  },
  {
    text: "한국에서 개(dog)의 어린모습을 의미하는 말로 알맞은것은?",
    choices: ["강아지", "고양이", "병아리", "야옹이"],
    answer: 0
  },
  {
    text: "한국에서 여자친구 또는 남자친구를 뜻하는 단어를 고르시오",
    choices: ["친구", "사람", "애인", "아이"],
    answer: 2
  }
]

const AdminPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const currentQuestion = quizData[currentIndex]

  const handleAnswer = (index) => {
    if (selected !== null) return
    setSelected(index)
    setIsCorrect(index === currentQuestion.answer)
  }

  const handleNext = () => {
    if (currentIndex + 1 < quizData.length) {
      setCurrentIndex(currentIndex + 1)
      setSelected(null)
      setIsCorrect(null)
    } else {
      setShowResult(true)
    }
  }

  return (
    <div className="p-10 max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-6">*초급* 다음 문제를 푸시오</h2>

      {showResult ? (
        <div className="text-xl font-semibold text-green-700">
          🎉 모든 문제를 다 풀었어요!
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow">
          <p className="text-lg font-medium mb-4">
            <span className="text-sm text-gray-500">문제 {currentIndex + 1} / {quizData.length}</span><br />
            {currentQuestion.text}
          </p>
          <div className="flex flex-col gap-3">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selected !== null}
                className={`
                  px-4 py-2 rounded border text-left
                  ${selected === index ? (
                    index === currentQuestion.answer
                      ? "bg-green-200 border-green-500"
                      : "bg-red-200 border-red-500"
                  ) : "hover:bg-gray-100"}
                `}
              >
                {choice}
              </button>
            ))}
          </div>

          {selected !== null && (
            <div className="mt-6">
              <p className="text-lg font-semibold mb-4">
                {isCorrect ? "✅ 정답입니다!" : "❌ 틀렸어요. 다시 확인해보세요!"}
              </p>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {currentIndex + 1 < quizData.length ? "다음 문제" : "결과 보기"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPage