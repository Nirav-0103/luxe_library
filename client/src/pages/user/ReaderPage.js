import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookAPI } from '../../api';
import toast from 'react-hot-toast';
import './ReaderPage.css';

export default function ReaderPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Reader Settings State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(18); // default px
  const [theme, setTheme] = useState('dark'); // 'light', 'dark', 'sepia'
  const [progress, setProgress] = useState(0);
  
  const contentRef = useRef(null);

  useEffect(() => {
    fetchBook();
    // Reattach scroll listener when theme/content loads
    return () => window.removeEventListener('scroll', handleScroll);
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const res = await getBookAPI(bookId);
      setBook(res.data.data);
    } catch (err) {
      toast.error('Failed to load the book data.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) {
      setProgress(100);
      return;
    }
    const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setProgress(Math.min(scrolled, 100));
  };
  
  // Quick lorem ipsum generator to simulate a full book chapter
  const generateChapters = () => {
    const chapters = [];
    for(let i=1; i<=3; i++) {
      chapters.push(
        <div key={i} className="reader-chapter">
          <h2>Chapter {i}</h2>
          <p className="reader-dropcap">L</p>
          <p style={{ marginTop: '-42px' }}>
            orem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut elit bibendum, commodo metus non, venenatis est. Praesent ac nulla in ex pulvinar congue. Nullam at orci quis nibh dignissim eleifend. Duis ut turpis quis sapien consectetur finibus. Cras semper imperdiet arcu eu volutpat. Suspendisse potenti. Nunc facilisis augue nec magna vehicula dictum. Vivamus et leo et sem euismod cursus vel eget tortor.
          </p>
          <p>
            Curabitur tincidunt hendrerit magna at mollis. Pellentesque a varius neque. Nulla venenatis accumsan tellus ac sollicitudin. Maecenas pulvinar ultrices arcu, sed aliquet mi iaculis vel. Integer sodales magna quis neque tempus cursus. Nam eu tincidunt libero, sit amet tempor libero. Pellentesque quis mauris interdum, efficitur sapien elementum, fringilla nisl.
          </p>
          <p>
            Phasellus accumsan orci vitae ante elementum tincidunt. Vivamus vulputate ligula vel scelerisque eleifend. Interdum et malesuada fames ac ante ipsum primis in faucibus. Fusce finibus ipsum ut tellus pharetra, vitae commodo libero rutrum. Nunc tempor purus non metus commodo aliquet. Aliquam id arcu sed elit iaculis elementum a quis nisi. Integer volutpat quam in scelerisque semper. Curabitur in risus neque.
          </p>
          <p>
            Etiam vel tortor non metus rutrum imperdiet vel in ex. Morbi feugiat tellus et orci finibus scelerisque. In sit amet orci condimentum, facilisis eros vel, venenatis elit. Donec posuere purus ut risus vestibulum semper. Cras tristique enim quis dui dignissim, eget faucibus dui venenatis. Fusce convallis interdum risus eu vulputate. Donec condimentum tincidunt justo, ac laoreet nulla rutrum eget. Mauris bibendum justo sit amet massa accumsan tincidunt.
          </p>
          <div className="reader-divider">❖ ❖ ❖</div>
        </div>
      );
    }
    return chapters;
  };

  if (loading) return <div className="reader-loading"><span className="spinner"></span></div>;
  if (!book) return null;

  return (
    <div className={`reader-layout theme-${theme}`}>
      {/* Top Navbar */}
      <div className={`reader-navbar ${settingsOpen ? 'open' : ''}`}>
        <button className="reader-btn" onClick={() => {
          if (window.history.length > 2) navigate(-1);
          else { window.close(); setTimeout(() => navigate('/dashboard'), 100); }
        }}>
          <span className="icon">←</span> Close
        </button>
        
        <div className="reader-titlebar">
          <h1 className="reader-title">{book.title}</h1>
          <span className="reader-author">by {book.author}</span>
        </div>

        <button className="reader-btn" onClick={() => setSettingsOpen(!settingsOpen)}>
          <span className="icon">Aa</span>
        </button>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="reader-settings-panel">
          <div className="settings-row">
            <span>Theme</span>
            <div className="theme-options">
              <button className={`theme-btn light ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Aa</button>
              <button className={`theme-btn sepia ${theme === 'sepia' ? 'active' : ''}`} onClick={() => setTheme('sepia')}>Aa</button>
              <button className={`theme-btn dark ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Aa</button>
            </div>
          </div>
          <div className="settings-row">
            <span>Text Size</span>
            <div className="font-options">
              <button className="font-btn" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A-</button>
              <span className="font-current">{fontSize}px</span>
              <button className="font-btn" onClick={() => setFontSize(Math.min(36, fontSize + 2))}>A+</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Content */}
      <div 
        className="reader-content-wrapper" 
        ref={contentRef} 
        onScroll={handleScroll}
        onClick={() => setSettingsOpen(false)}
      >
        <div className="reader-content-inner" style={{ fontSize: `${fontSize}px` }}>
          <div className="reader-book-cover">
            <img src={book.coverImage} alt={book.title} />
            <h1>{book.title}</h1>
            <h2>{book.author}</h2>
            <div className="reader-publisher">Luxe Library Digital Editions</div>
          </div>
          
          {generateChapters()}
          
          <div className="reader-end">
            <h3>The End</h3>
            <p>Thank you for reading this preview copy on Luxe Library.</p>
            <button className="reader-finish-btn" onClick={() => {
              if (window.history.length > 2) navigate(-1);
              else { window.close(); setTimeout(() => navigate('/dashboard'), 100); }
            }}>Close Book</button>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="reader-progress-bar">
        <div className="reader-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
