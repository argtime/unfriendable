import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(25);

      if (error) {
        setError('Failed to fetch search results.');
        console.error(error);
      } else {
        setResults(data || []);
      }
      setLoading(false);
    };

    performSearch();
  }, [query]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Search Results for <span className="text-accent">"{query}"</span>
      </h1>
      
      {loading && <div className="flex justify-center mt-10"><Spinner /></div>}
      
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(user => (
                <Link to={`/profile/${user.username}`} key={user.id}>
                  <Card className="hover:border-accent transition-all duration-200 ease-in-out hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <Avatar displayName={user.display_name} size="md" />
                      <div>
                        <h2 className="text-xl font-bold">{user.display_name}</h2>
                        <p className="text-medium">@{user.username}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-medium mt-10">No users found.</p>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;