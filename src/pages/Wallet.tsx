import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Wallet as WalletIcon, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

interface WalletItem {
  id: number;
  token_id: string;
  balance: number;
  value_usd: number;
  price_usd?: number;
}

const Wallet: React.FC = () => {
  const [walletItems, setWalletItems] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/wallet');
        setWalletItems(response.data);
        
        // Calculate total value
        const total = response.data.reduce((sum: number, item: WalletItem) => sum + item.value_usd, 0);
        setTotalValue(total);
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWallet();
  }, []);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Wallet
          </h2>
        </div>
      </div>
      
      {/* Portfolio Value Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg mb-8">
        <div className="px-6 py-8">
          <div className="flex items-center">
            <WalletIcon className="h-10 w-10 text-white opacity-80" />
            <h3 className="ml-3 text-xl font-medium text-white">Portfolio Value</h3>
          </div>
          <div className="mt-6">
            <p className="text-4xl font-bold text-white">${totalValue.toLocaleString()}</p>
            <p className="mt-2 text-white text-opacity-80">Total balance across all assets</p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : walletItems.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value (USD)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Portfolio
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {walletItems.map((item) => {
                  const percentOfPortfolio = (item.value_usd / totalValue) * 100;
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.token_id === 'usd' ? (
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-indigo-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.token_id === 'usd' ? 'US Dollar' : item.token_id.toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.token_id === 'usd' ? 'USD' : item.token_id.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.balance.toLocaleString()} {item.token_id.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.token_id === 'usd' ? '$1.00' : `$${item.price_usd?.toLocaleString() || '0.00'}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${item.value_usd.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${percentOfPortfolio}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {percentOfPortfolio.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {item.token_id !== 'usd' && (
                          <Link to={`/token/${item.token_id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end">
                            Trade <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-12 text-center">
            <div className="text-gray-500 mb-4">Your wallet is empty. Start trading to add assets.</div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Trading
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
