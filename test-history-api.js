async function testHistoryAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/toilet-inspections/history?area_code=toilet-bea-cukai&toilet_type=laki_perempuan&limit=100&offset=0');
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testHistoryAPI();
