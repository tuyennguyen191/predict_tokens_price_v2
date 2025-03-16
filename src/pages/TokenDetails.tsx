import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart2, 
  Globe, 
  GitHub, 
  Twitter, 
  MessageCircle, 
  Star, 
  StarOff,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TokenDetails {
  id: string;
  symbol: string;
  name: string;
  image: {
    large: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    ath: {
      usd: number;
    };
    ath_date: {
      usd: string;
    };
    atl: {
      usd: number;
    };
    atl_date: {
      usd: string;
    };
  };
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
    repos_url: {
      github: string[];
    };
    twitter_screen_name: string;
    subreddit_url: string;
  };
}

interface PriceHistory {
  prices: [number, number][];
}

interface WalletItem {
  token_id: string;
  balance: number;
}

const TokenDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null);
  const [prediction, setPrediction] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [wallet, setWallet] = useState<WalletItem | null>(null);
  const [usdBalance, setUsdBalance] = useState(0);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch token details and price history
        const response = await axios.get(`http://localhost:5000/api/tokens/${id}`);
        setTokenDetails(response.data.details);
        setPriceHistory(response.data.history);
        setPrediction(response.data.prediction);
        
        // Check if token is in favorites
        if (isAuthenticated) {
          const profileResponse = await axios.get('http://localhost:5000/api/user/profile');
          const favoriteIds = profileResponse.data.favorites.map((fav: any) => fav.token_id);
          setIsFavorite(favoriteIds.includes(id));
          
          // Get wallet info
          const walletResponse = await axios.get('http://localhost:5000/api/wallet');
          const tokenWallet = walletResponse.data.find((item: WalletItem) => item.token_id === id);
          const usdWallet = walletResponse.data.find((item: WalletItem) => item.token_id === 'usd');
          
          if (tokenWallet) {
            setWallet(tokenWallet);
          }
          
          if (usdWallet) {
            setUsdBalance(usdWallet.balance);
          }
        }
      } catch (error) {
        console.error('Error fetching token details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
    
    // Reset trade status when component mounts or id changes
    setTradeSuccess(false);
    setTradeError('');
  }, [id, isAuthenticated]);
  
  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        // Remove from favorites
        await axios.delete(`http://localhost:5000/api/favorites/${id}`);
        setIsFavorite(false);
      } else {
        // Add to favorites
        if (tokenDetails) {
          await axios.post('http://localhost:5000/api/favorites', {
            token_id: tokenDetails.id,
            token_symbol: tokenDetails.symbol,
            token_name: tokenDetails.name
          });
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  
  const executeTrade = async () => {
    try {
      setTradeSuccess(false);
      setTradeError('');
      
      if (!tokenDetails || !tradeAmount || parseFloat(tradeAmount) <= 0) {
        setTradeError('Please enter a valid amount');
        return;
      }
      
      const amount = parseFloat(tradeAmount);
      const price = tokenDetails.market_data.current_price.usd;
      
      if (tradeType === 'buy') {
        // Check if user has enough USD
        if (amount * price > usdBalance) {
          setTradeError('Insufficient USD balance');
          return;
        }
      } else {
        // Check if user has enough tokens
        if (!wallet || amount > wallet.balance) {
          setTradeError('Insufficient token balance');
          return;
        }
      }
      
      // Execute trade
      await axios.post('http://localhost:5000/api/trade', {
        token_id: id,
        type: tradeType,
        amount,
        price
      });
      
      setTradeSuccess(true);
      setTradeAmount('');
      
      // Refresh wallet data
      const walletResponse = await axios.get('http://localhost:5000/api/wallet');
      const tokenWallet = walletResponse.data.find((item: WalletItem) => item.token_id === id);
      const usdWallet = walletResponse.data.find((item: WalletItem) => item.token_id === 'usd');
      
      if (tokenWallet) {
        setWallet(tokenWallet);
      } else {
        setWallet(null);
      }
      
      if (usdWallet) {
        setUsdBalance(usdWallet.balance);
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      setTradeError('Failed to execute trade. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!tokenDetails || !priceHistory) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Token not found</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>The token you are looking for does not exist or could not be loaded.</p>
            </div>
            <div className="mt-5">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Prepare chart data
  const priceData = priceHistory.prices.map(price => price[1]);
  const labels = priceHistory.prices.map(price => {
    const date = new Date(price[0]);
    return date.toLocaleDateString();
  });
  
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Historical Price (USD)',
        data: priceData,
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Price Prediction (USD)',
        data: prediction || [],
        borderColor: 'rgb(220, 38, 38)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 0
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Token Header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div className="flex items-center">
            <img
              className="h-16 w-16 rounded-full mr-4"
              src={tokenDetails.image.large}
              alt={tokenDetails.name}
            />
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                {tokenDetails.name}
                <span className="ml-2 text-gray-500 text-lg">
                  {tokenDetails.symbol.toUpperCase()}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={toggleFavorite}
                    className="ml-4 text-gray-400 hover:text-yellow-500 focus:outline-none"
                  >
                    {isFavorite ? (
                      <Star className="h-6 w-6 text-yellow-500" />
                    ) : (
                      <StarOff className="h-6 w-6" />
                    )}
                  </button>
                )}
              </h3>
              <div className="mt-1 flex items-center">
                <span className="text-3xl font-bold text-gray-900">
                  ${tokenDetails.market_data.current_price.usd.toLocaleString()}
                </span>
                <span
                  className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    tokenDetails.market_data.price_change_percentage_24h >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tokenDetails.market_data.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {tokenDetails.market_data.price_change_percentage_24h >= 0 ? '+' : ''}
                  {tokenDetails.market_data.price_change_percentage_24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <div>
              <Link
                to="/transactions"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Transaction History
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Chart and Market Stats */}
        <div className="lg:col-span-2">
          {/* Price Chart */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Price Chart (30 Days) with Prediction
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <Line data={chartData} options={chartOptions} height={80} />
            </div>
          </div>
          
          {/* Market Stats */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Market Statistics</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-gray-400" />
                    Market Cap
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${tokenDetails.market_data.market_cap.usd.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BarChart2 className="mr-2 h-5 w-5 text-gray-400" />
                    24h Trading Volume
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${tokenDetails.market_data.total_volume.usd.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Circulating Supply</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {tokenDetails.market_data.circulating_supply.toLocaleString()} {tokenDetails.symbol.toUpperCase()}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Total Supply</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {tokenDetails.market_data.total_supply
                      ? `${tokenDetails.market_data.total_supply.toLocaleString()} ${tokenDetails.symbol.toUpperCase()}`
                      : 'Not Available'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Max Supply</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {tokenDetails.market_data.max_supply
                      ? `${tokenDetails.market_data.max_supply.toLocaleString()} ${tokenDetails.symbol.toUpperCase()}`
                      : 'Not Available'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">All-Time High</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${tokenDetails.market_data.ath.usd.toLocaleString()} 
                    <span className="text-gray-500 ml-2">
                      ({new Date(tokenDetails.market_data.ath_date.usd).toLocaleDateString()})
                    </span>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">All-Time Low</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${tokenDetails.market_data.atl.usd.toLocaleString()} 
                    <span className="text-gray-500 ml-2">
                      ({new Date(tokenDetails.market_data.atl_date.usd).toLocaleDateString()})
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {/* Right Column - Trading and Info */}
        <div>
          {/* Trading Panel (for authenticated users) */}
          {isAuthenticated && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Trade {tokenDetails.symbol.toUpperCase()}</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {/* Wallet Balance */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Your Balance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">USD</div>
                      <div className="text-lg font-medium">${usdBalance.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">{tokenDetails.symbol.toUpperCase()}</div>
                      <div className="text-lg font-medium">
                        {wallet ? wallet.balance.toLocaleString() : '0'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Trade Type Selector */}
                <div className="mb-4">
                  <div className="flex rounded-md shadow-sm">
                    <button
                      type="button"
                      className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        tradeType === 'buy'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setTradeType('buy')}
                    >
                      <ArrowDownRight className="mr-2 h-4 w-4" />
                      Buy
                    </button>
                    <button
                      type="button"
                      className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        tradeType === 'sell'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setTradeType('sell')}
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Sell
                    </button>
                  </div>
                </div>
                
                {/* Amount Input */}
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount ({tokenDetails.symbol.toUpperCase()})
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{tokenDetails.symbol.toUpperCase()}</span>
                    </div>
                  </div>
                  {tradeAmount && (
                    <div className="mt-2 text-sm text-gray-500">
                      ≈ ${(parseFloat(tradeAmount) * tokenDetails.market_data.current_price.usd).toLocaleString()} USD
                    </div>
                  )}
                </div>
                
                {/* Execute Button */}
                <button
                  type="button"
                  className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    tradeType === 'buy'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  onClick={executeTrade}
                >
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {tokenDetails.symbol.toUpperCase()}
                </button>
                
                {/* Success/Error Messages */}
                {tradeSuccess && (
                  <div className="mt-4 rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Trade executed successfully!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {tradeError && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {tradeError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Token Info */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">About {tokenDetails.name}</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: tokenDetails.description.en }} />
            </div>
          </div>
          
          {/* Links */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Resources</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {tokenDetails.links.homepage[0] && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Globe className="mr-2 h-5 w-5 text-gray-400" />
                      Website
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <a href={tokenDetails.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        {tokenDetails.links.homepage[0]}
                      </a>
                    </dd>
                  </div>
                )}
                
                {tokenDetails.links.blockchain_site[0] && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5 text-gray-400" />
                      Explorer
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <a href={tokenDetails.links.blockchain_site[0]} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        {tokenDetails.links.blockchain_site[0]}
                      </a>
                    </dd>
                  </div>
                )}
                
                {tokenDetails.links.repos_url.github[0] && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <GitHub className="mr-2 h-5 w-5 text-gray-400" />
                      GitHub
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <a href={tokenDetails.links.repos_url.github[0]} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        {tokenDetails.links.repos_url.github[0]}
                      </a>
                    </dd>
                  </div>
                )}
                
                {tokenDetails.links.twitter_screen_name && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Twitter className="mr-2 h-5 w-5 text-gray-400" />
                      Twitter
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <a href={`https://twitter.com/${tokenDetails.links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        @{tokenDetails.links.twitter_screen_name}
                      </a>
                    </dd>
                  </div>
                )}
                
                {tokenDetails.links.subreddit_url && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MessageCircle className="mr-2 h-5 w-5 text-gray-400" />
                      Reddit
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <a href={tokenDetails.links.subreddit_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        {tokenDetails.links.subreddit_url}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetails;
