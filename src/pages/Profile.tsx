import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, Star, Clock, Settings, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Favorite {
  id: number;
  token_id: string;
  token_symbol: string;
  token_name: string;
}

interface Transaction {
  id: number;
  token_id: string;
  type: string;
  amount: number;
  price: number;
  timestamp: string;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile with favorites
        const profileResponse = await axios.get('http://localhost:5000/api/user/profile');
        setFavorites(profileResponse.data.favorites);
        
        // Fetch recent transactions
        const transactionsResponse = await axios.get('http://localhost:5000/api/transactions');
        setRecentTransactions(transactionsResponse.data.slice(0, 5)); // Get only the 5 most recent
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  const handleLogout = () => {
    logout();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Profile
          </h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Info */}
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 flex items-center">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {user?.username}
                </h3>
                <p className="text-sm text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-gray-400" />
                    Member Since
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date().toLocaleDateString()} {/* This would ideally come from the user object */}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Account Actions</h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="divide-y divide-gray-200">
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700">Account Settings</span>
                  </div>
                  <div>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700">Security</span>
                  </div>
                  <div>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 text-red-400 mr-3" />
                    <span className="text-sm text-red-600">Logout</span>
                  </div>
                  <div>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Favorites and Recent Transactions */}
        <div className="lg:col-span-2">
          {/* Favorites */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                Favorite Tokens
              </h3>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View All
              </Link>
            </div>
            <div className="border-t border-gray-200">
              {favorites.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {favorites.map((favorite) => (
                    <li key={favorite.id}>
                      <Link to={`/token/${favorite.token_id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {favorite.token_symbol.toUpperCase().substring(0, 2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{favorite.token_name}</div>
                              <div className="text-sm text-gray-500">{favorite.token_symbol.toUpperCase()}</div>
                            </div>
                          </div>
                          <div>
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-5 text-center text-sm text-gray-500">
                  <p>You haven't added any favorites yet.</p>
                  <Link
                    to="/dashboard"
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Browse Tokens
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                Recent Transactions
              </h3>
              <Link
                to="/transactions"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View All
              </Link>
            </div>
            <div className="border-t border-gray-200">
              {recentTransactions.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => {
                    const date = new Date(transaction.timestamp);
                    const totalValue = transaction.amount * transaction.price;
                    
                    return (
                      <li key={transaction.id}>
                        <Link to={`/token/${transaction.token_id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                  transaction.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                  {transaction.type === 'buy' ? (
                                    <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {transaction.type === 'buy' ? 'Bought' : 'Sold'} {transaction.token_id.toUpperCase()}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {transaction.amount.toLocaleString()} {transaction.token_id.toUpperCase()} at ${transaction.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <div className="text-sm text-gray-500 text-right">
                                  <div>${totalValue.toLocaleString()}</div>
                                  <div>{date.toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-4 py-5 text-center text-sm text-gray-500">
                  <p>You haven't made any transactions yet.</p>
                  <Link
                    to="/dashboard"
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Start Trading
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
