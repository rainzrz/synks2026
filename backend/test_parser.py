"""
Test script for markdown parser
Run this to test the parsing logic independently
"""

import re
from typing import List
from pydantic import BaseModel

class LinkItem(BaseModel):
    name: str
    url: str

class ProductGroup(BaseModel):
    country: str
    product: str
    environment: str
    links: List[LinkItem]

def parse_markdown_links(content: str) -> List[ProductGroup]:
    """
    Parse markdown content to extract product links
    """
    groups = []
    lines = content.split('\n')
    
    current_group = None
    current_country = None
    current_product = None
    current_env = None
    current_links = []
    
    for line in lines:
        line = line.strip()
        
        # Detect country/product header (e.g., "🇧🇷 A.Buhler Compose 6.0")
        if line and not line.startswith('*') and not line.startswith('-') and not line.startswith('#'):
            # Save previous group if exists
            if current_country and current_links:
                groups.append(ProductGroup(
                    country=current_country,
                    product=current_product or "",
                    environment=current_env or "",
                    links=current_links
                ))
                current_links = []
            
            # Parse new header
            parts = line.split()
            if len(parts) >= 2:
                current_country = ' '.join(parts[:2]) if parts[0].startswith('🇧🇷') else parts[0]
                current_product = ' '.join(parts[2:]) if len(parts) > 2 else ""
        
        # Detect environment (e.g., "PTA")
        elif line and not line.startswith('*') and not line.startswith('-') and line.isupper():
            current_env = line
        
        # Detect markdown links
        elif line.startswith('*') or line.startswith('-'):
            # Extract link using regex
            link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
            matches = re.findall(link_pattern, line)
            
            for name, url in matches:
                current_links.append(LinkItem(name=name.strip(), url=url.strip()))
    
    # Add last group
    if current_country and current_links:
        groups.append(ProductGroup(
            country=current_country,
            product=current_product or "",
            environment=current_env or "",
            links=current_links
        ))
    
    return groups

# Test with sample markdown
test_markdown = """
🇧🇷 A.Buhler Compose 6.0
PTA
* - [Antara](http://pta.antara.abuhler.com.br:8095/antara/antara.jnlp)
- [SelectionPO](http://pta.antara.abuhler.com.br:8095/antara/selectionPO.jnlp)
- [Production](http://pta.antara.abuhler.com.br:8095/antara/AntaraProduction.jnlp)
- [AntaraED](http://pta-antara-ed.antara.abuhler.com.br:8095/)
- [Management](http://pta-management.antara.abuhler.com.br:8095/)

🇧🇷 Another Product System 2.0
PROD
- [Dashboard](http://prod.dashboard.example.com:8080/)
- [Admin](http://prod.admin.example.com:8080/admin)
- [Reports](http://prod.reports.example.com:8080/reports)
"""

if __name__ == "__main__":
    print("Testing Markdown Parser...")
    print("=" * 60)
    
    groups = parse_markdown_links(test_markdown)
    
    print(f"\nFound {len(groups)} product groups:\n")
    
    for i, group in enumerate(groups, 1):
        print(f"Group {i}:")
        print(f"  Country: {group.country}")
        print(f"  Product: {group.product}")
        print(f"  Environment: {group.environment}")
        print(f"  Links ({len(group.links)}):")
        for link in group.links:
            print(f"    - {link.name}: {link.url}")
        print()
    
    # Export as JSON
    import json
    print("\nJSON Output:")
    print("=" * 60)
    json_output = [group.model_dump() for group in groups]
    print(json.dumps(json_output, indent=2, ensure_ascii=False))