import { useMemo } from 'react';

const HomeFooter = () => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="home-footer">
      <div className="footer-links">
        <div>
          <h4>고객 서비스</h4>
          <ul>
            <li>공지사항</li>
            <li>자주 묻는 질문</li>
            <li>1:1 문의</li>
          </ul>
        </div>
        <div>
          <h4>회사 소개</h4>
          <ul>
            <li>회사 소개</li>
            <li>인재 채용</li>
            <li>이용 약관</li>
          </ul>
        </div>
        <div>
          <h4>고객센터</h4>
          <p>1588-1234 (평일 10:00 - 17:00)</p>
          <p className="footer-email">help@vibemall.com</p>
        </div>
      </div>
      <p className="footer-copy">© {currentYear} VIBE MALL. All rights reserved.</p>
    </footer>
  );
};

export default HomeFooter;

