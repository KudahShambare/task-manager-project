  export const login = async (email, password) => {
    const response = await fetch("http://localhost:5000/signin", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed'); 
    }

    return data;
  };


   export const register = async (email, password,fullname) => {
    const response = await fetch("http://localhost:5000/signup", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password,fullname })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed'); 
    }

    return data;
  };
