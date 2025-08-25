import Link from "next/link";
import { useState } from "react";
import InstallApp from "@/components/installapp";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="navbar">
      <div className="nav-container">
      <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
  <span>AksharaTantra</span>
</div>


        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>

       <ul className={isOpen ? "nav-menu open" : "nav-menu"}>
  

          <li className="upload">
            <Link href="/upload">
              <span className="icon upload-icon" aria-label="Upload">
                📤
              </span>
          Upload 
            </Link>
          </li>

          <li className="upload">
            <Link href="/OCR">
              <span className="icon upload-icon" aria-label="Upload">
                🖼️ 
              </span>
             OCR
            </Link>
           </li>
          <li className="upload">
            <Link href="/Sanskrit">
              <span className="icon upload-icon" aria-label="Upload">
                
              </span>
             यथाक्षरं पठनम्
            </Link>
            </li>
{/*    <li className="about">
            <Link href="/about">
              <span className="icon about-icon" aria-label="Home">
                🧰
              </span>
           Tech stack
            </Link>
          </li> 
           <li className="about">
            <Link href="/Media">
              <span className="icon about-icon" aria-label="Media">
                🎥
              </span>
            Media
            </Link>
          </li>  */}
            <li className="about">
            <Link href="/Manuscript">
              <span className="icon about-icon" aria-label="Media">
                🎥
              </span>
            Manuscript
            </Link>
          </li> 
             
          <li className="install">
            {/* Install button from InstallApp component */}
            <InstallApp />
          </li>
        </ul>
      </div>
    </nav>
  );
}
