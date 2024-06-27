import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-10 bottom-0 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rendment</h3>
            <ul>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Twitter
                </a>
              </li>
              <li className="text-sm">©2024 Rendment. All rights reserved</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About</h3>
            <ul>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Terms
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Products</h3>
            <ul>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Lending
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Liquidity
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Multiply
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Leverage
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Creator Vaults
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Litepaper
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  K-Lend Risk Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Leaderboard (Coming Soon)
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Referrals (Coming Soon)
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connect</h3>
            <ul>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm mt-8 border-t border-white border-opacity-50 pt-4">
          ©2024 Rendment. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
