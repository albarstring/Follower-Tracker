export interface InstagramUser {
  username: string;
  timestamp?: number;
}

// Fungsi serbaguna untuk mengekstrak data dari berbagai format JSON Instagram
export function parseInstagramData(jsonData: any): InstagramUser[] {
  const users: InstagramUser[] = [];
  
  const extract = (obj: any, parentTitle?: string) => {
    if (!obj) return;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => extract(item, parentTitle));
    } else if (typeof obj === 'object') {
      // Jika object ini punya title (dari following.json structure), simpan untuk digunakan
      const currentTitle = obj.title || parentTitle;
      
      // Format resmi JSON Instagram: string_list_data
      if (obj.string_list_data && Array.isArray(obj.string_list_data)) {
        obj.string_list_data.forEach((item: any) => {
          // Coba ekstrak username dari berbagai sumber dalam urutan prioritas:
          // 1. item.value (followers format)
          // 2. currentTitle (following format - dari parent obj)
          // 3. Extract dari item.href (URL fallback)
          let username = item.value;
          
          if (!username && currentTitle) {
            username = currentTitle;
          }
          
          if (!username && item.href && typeof item.href === 'string') {
            // Extract username dari URL: https://www.instagram.com/_u/username
            const urlParts = item.href.split('/');
            username = urlParts[urlParts.length - 1];
          }

          if (username) {
            users.push({
              username: String(username).trim().toLowerCase(),
              timestamp: item.timestamp
            });
          }
        });
      } else {
        // Telusuri lebih dalam, pass currentTitle ke rekursi
        Object.values(obj).forEach(val => extract(val, currentTitle));
      }
    }
  };

  extract(jsonData);
  
  // Hapus duplikat seandainya ada data ganda
  const uniqueUsers = Array.from(new Map(users.map(u => [u.username, u])).values());
  
  return uniqueUsers;
}
