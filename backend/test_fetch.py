import httpx
import asyncio

async def test_fetch():
    url = "http://mint.systemhaus.com.br:9070/api/v4/projects/document-group%2Fsystemhaus-pt_br/wikis/antara_links"

    print(f"Fetching: {url}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(url, headers=headers)

        print(f"Status code: {response.status_code}")
        print(f"Final URL: {response.url}")
        print(f"Content length: {len(response.text)}")
        print(f"\nFirst 500 chars of content:")
        print(response.text[:500])

        # Try parsing JSON
        import json
        try:
            data = json.loads(response.text)
            print(f"\nJSON parsed successfully!")
            print(f"Keys: {data.keys()}")
            print(f"Content length: {len(data.get('content', ''))}")
        except json.JSONDecodeError as e:
            print(f"\nFailed to parse JSON: {e}")

asyncio.run(test_fetch())
