import React from 'react';

const Home: React.FC = () => {
  return (
    <main className="flex flex-col items-center justify-between h-screen p-4">
      <div className="z-10 w-full max-w-5xl font-mono text-sm lg:flex flex flex-col space-y-4 lg:space-y-0">
        <h1 className="text-2xl">Dashboard</h1>
        <div className="text-sm">Track all your positions in one place</div>
        <div className="flex lg:flex-nowrap justify-between pt-4 space-y-4 lg:space-y-0 lg:space-x-4">
          {[
            { title: 'Net value', value: '$0.00', subvalue: '0 SOL' },
            { title: 'Fees & Interest', value: '$0.00', subvalue: '0 SOL' },
            {
              title: 'RDMT Staking',
              value: '0',
              subvalue: '30.00% Stacking Boost',
              valueClass: 'text-blue-500',
            },
            {
              title: 'Season 2 Points',
              value: '0',
              subvalue: '0.0 x Boost',
              valueClass: 'text-orange-400',
            },
            { title: 'Positions', value: '0', valueClass: 'text-green-400' },
          ].map(
            ({ title, value, subvalue, valueClass = 'text-2xl' }, index) => (
              <div key={index} className="flex flex-col w-full lg:w-1/5">
                <div className="min-h-max flex-grow cursor-pointer justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                  <h2>{title}</h2>
                  <h1 className={`text-2xl ${valueClass}`}>{value}</h1>
                  {subvalue && <h2>{subvalue}</h2>}
                </div>
              </div>
            )
          )}
        </div>
        <div className="border-b pt-8 opacity-20"></div>
        <div className="flex justify-between pt-8">
          <div className="flex bg-white bg-opacity-15 w-fit rounded-lg">
            <button className="bg-black border border-white border-opacity-20 rounded-lg p-2">
              Positions Overview
            </button>
            <button className="rounded-lg p-2">Transaction History</button>
          </div>
          <div className="bg-black border border-white border-opacity-20 rounded-lg p-2">
            Show: All positions
          </div>
        </div>
        <div className="border-b pt-8 opacity-20"></div>
        <div className="space-y-4 pt-8 w-full border rounded-lg border-white border-opacity-20 flex flex-col justify-center p-8">
          <div className="flex justify-center font-bold text-base">
            No open positions yet
          </div>
          <div className="flex justify-center">
            Connect wallet to see performance of your positions
          </div>
          <button className="flex justify-center border w-fit p-2 m-auto rounded-lg border-white border-opacity-20">
            Explore products
          </button>
        </div>
      </div>
    </main>
  );
};

export default Home;
