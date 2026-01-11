# Simple Status Check - Ping and Telnet only
# Replace the complex httpx implementation with this simpler version

import subprocess
import socket
from urllib.parse import urlparse
from typing import Dict

def simple_check_link_status(url: str) -> Dict:
    """
    Simple status check using ping and telnet
    Returns: {status: 'online'|'offline', response_time: int, method: str}
    """
    try:
        # Parse URL to get hostname and port
        parsed = urlparse(url)
        hostname = parsed.hostname or parsed.netloc.split(':')[0]

        # Determine port based on scheme
        if parsed.port:
            port = parsed.port
        elif parsed.scheme == 'https':
            port = 443
        elif parsed.scheme == 'http':
            port = 80
        else:
            port = 80

        # Try telnet first (faster and more reliable for web servers)
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)  # 2 second timeout (reduced from 5)

            import time
            start_time = time.time()
            result = sock.connect_ex((hostname, port))
            end_time = time.time()

            sock.close()

            response_time = int((end_time - start_time) * 1000)

            if result == 0:
                return {
                    "status": "online",
                    "response_time": response_time,
                    "method": "telnet"
                }
            else:
                # Telnet failed - mark as offline without ping fallback
                return {
                    "status": "offline",
                    "response_time": response_time,
                    "method": "telnet",
                    "error": "Connection refused"
                }

        except socket.timeout:
            return {
                "status": "offline",
                "response_time": 2000,
                "method": "telnet",
                "error": "Connection timeout"
            }
        except Exception as e:
            return {
                "status": "offline",
                "response_time": 0,
                "method": "telnet",
                "error": str(e)
            }

    except Exception as e:
        return {
            "status": "offline",
            "response_time": 0,
            "method": "error",
            "error": str(e)
        }


def try_ping(hostname: str) -> Dict:
    """
    Fallback to ping if telnet fails
    """
    try:
        # Ping command varies by OS
        import platform

        param = '-n' if platform.system().lower() == 'windows' else '-c'
        command = ['ping', param, '1', '-w', '3000', hostname]

        import time
        start_time = time.time()

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=5
        )

        end_time = time.time()
        response_time = int((end_time - start_time) * 1000)

        if result.returncode == 0:
            return {
                "status": "online",
                "response_time": response_time,
                "method": "ping"
            }
        else:
            return {
                "status": "offline",
                "response_time": response_time,
                "method": "ping",
                "error": "Ping failed"
            }

    except subprocess.TimeoutExpired:
        return {
            "status": "offline",
            "response_time": 5000,
            "method": "ping",
            "error": "Ping timeout"
        }
    except Exception as e:
        return {
            "status": "offline",
            "response_time": 0,
            "method": "ping",
            "error": str(e)
        }


# Async wrapper for FastAPI
async def check_link_status(url: str) -> Dict:
    """
    Async wrapper for the simple status check
    FastAPI uses async, so we wrap the sync function
    """
    import asyncio
    return await asyncio.to_thread(simple_check_link_status, url)


# ============================================
# Usage example in your analytics_endpoints.py
# ============================================
# Replace the existing check_link_status function with:
#
# from simple_status_check import check_link_status
#
# That's it! Now status checks use simple ping/telnet
