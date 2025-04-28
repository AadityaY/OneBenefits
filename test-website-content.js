import axios from 'axios';

async function testWebsiteContent() {
  try {
    // First, log in to get session cookie
    const loginRes = await axios.post('http://localhost:5000/api/login', {
      username: 'admin1',
      password: 'password'
    }, {
      withCredentials: true
    });
    
    // Get the cookies from the login response
    const cookies = loginRes.headers['set-cookie'];
    
    // Use the cookies for the website content request
    const contentRes = await axios.get('http://localhost:5000/api/website-content', {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    console.log('Website Content Response:');
    console.log(JSON.stringify(contentRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testWebsiteContent();