import './pages.css';

function LevelPage() {
    return (
        <main style={{ padding: 16 }}>
            <div>
                <span>Q. 다음 중 정답은</span>
                <span className="space" aria-hidden="true"></span>
                <span> 무엇인가요?</span>
            </div>
            <div>
                <div>
                    <button>1번</button>
                    <span>정답 1</span>
                </div>
                <div>
                    <button>2번</button>
                    <span>정답 2</span>
                </div>
                <div>
                    <button>3번</button>
                    <span>정답 3</span>
                </div>
                <div>
                    <button>4번</button>
                    <span>정답 4</span>
                </div>
            </div>
            <div>
                <p className="hidden">정답입니다.</p>
                <button>다음문제</button>
            </div>
        </main>
    );
}
export default LevelPage;