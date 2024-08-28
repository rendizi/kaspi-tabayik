import { FaGithub, FaLinkedin, FaTelegramPlane, FaHeart } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { GiInfo } from 'react-icons/gi';

export function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-6">
            <div className="container mx-auto flex flex-col items-center">
                <div className="text-center mb-6">
                    <p className="text-lg font-semibold">&copy; {new Date().getFullYear()} 7s. All rights reserved.</p>
                    <p className="mt-2 text-sm flex items-center">
                        Made with <FaHeart className="text-red-500 mx-1" /> by Baglanov Alikhan
                    </p>
                </div>
                <div className="flex space-x-6 mb-6">
                    <a href="/about" className="flex items-center space-x-2 hover:text-gray-400 transition">
                        <GiInfo className="text-xl" />
                        <span>About Us</span>
                    </a>
                    <a href="mailto:baglanov.a0930@gmail.com" className="flex items-center space-x-2 hover:text-gray-400 transition">
                        <MdEmail className="text-xl" />
                        <span>Contact Us</span>
                    </a>
                    <a href="https://github.com/rendizi/tabayik" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-gray-400 transition">
                        <FaGithub className="text-xl" />
                        <span>GitHub</span>
                    </a>
                    <a href="https://t.me/svnstrqoqoqoqo" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-gray-400 transition">
                        <FaTelegramPlane className="text-xl" />
                        <span>Telegram</span>
                    </a>
                    <a href="https://linkedin.com/in/yourlinkedin" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-gray-400 transition">
                        <FaLinkedin className="text-xl" />
                        <span>LinkedIn</span>
                    </a>
                </div>
                <p className="text-sm text-gray-400">59 Tole bi st., Almaty city, Republic of Kazakhstan</p>
            </div>
        </footer>
    );
}
