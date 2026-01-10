import urllib.parse

wiki_url = "http://mint.systemhaus.com.br:9070/document-group/systemhaus-pt_br/-/wikis/antara_links"

parts = wiki_url.split('/')
print(f"URL parts: {parts}")
print(f"Parts count: {len(parts)}")

project_path = '/'.join(parts[3:5])  # document-group/systemhaus-pt_br
wiki_page = parts[-1]  # antara_links

project_path_encoded = urllib.parse.quote(project_path, safe='')
base_url = f"{parts[0]}//{parts[2]}"
api_url = f"{base_url}/api/v4/projects/{project_path_encoded}/wikis/{wiki_page}"

print(f"\nProject path: {project_path}")
print(f"Project path encoded: {project_path_encoded}")
print(f"Wiki page: {wiki_page}")
print(f"Base URL: {base_url}")
print(f"\nAPI URL construída:")
print(api_url)
