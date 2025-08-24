import Link from "next/link";
import { useState } from "react";
import InstallApp from "@/components/installapp";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="navbar">
      <div className="nav-container">
         <div className="logo">
        <img
  src="/icon-512.png"
  alt="AksharaTantra logo"
  style={{
    width: 35,          
    height: 35,          // reduced from 48
    marginRight: 16,
    verticalAlign: "middle",
    objectFit: "contain",
  }}
/>

    AksharaTantra    
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
   <li className="about">
            <Link href="/about">
              <span className="icon about-icon" aria-label="Home">
                🧰
              </span>
           Tech stack
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
