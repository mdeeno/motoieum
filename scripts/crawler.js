const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

// 1. 환경변수 확인
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 환경변수(URL 또는 Service Role Key)가 없습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const parser = new Parser();

// 🛠️ 헬퍼 함수: 텍스트 정제 (지저분한 글자 제거)
function cleanText(text, keyword) {
  if (!text) return '';
  // 예: "적산거리 : 15,000km" -> "15,000km"
  const parts = text.split(':');
  if (parts.length > 1) return parts[1].trim();
  return text.replace(keyword, '').trim();
}

// ==========================================
// 1️⃣ 중검단 블로그 (RSS -> 상세페이지 파싱)
// ==========================================
async function crawlJunggeomdan() {
  console.log('🔄 [중검단] 크롤링 시작...');
  try {
    const feed = await parser.parseURL(
      'https://rss.blog.naver.com/usedcheck.xml'
    );
    // 최근 5개 글만 확인
    const recentPosts = feed.items.slice(0, 5);

    for (const post of recentPosts) {
      // 중복 확인
      const { data: existing } = await supabase
        .from('market')
        .select('id')
        .eq('external_link', post.link)
        .single();

      if (!existing) {
        // 모바일 페이지로 변환 (파싱 용이)
        const mobileLink = post.link.replace(
          'https://blog.naver.com',
          'https://m.blog.naver.com'
        );

        let price = '가격 문의';
        let imageUrl = null;
        let year = '';
        let mileage = '';

        try {
          const { data: html } = await axios.get(mobileLink);
          const $ = cheerio.load(html);

          // 📸 이미지
          const firstImg = $('div.se-main-container img').first();
          if (firstImg.length) imageUrl = firstImg.attr('src');

          // 🔍 정보 파싱
          $('p, span, div').each((i, el) => {
            const text = $(el).text();
            if (text.includes('차량가격')) price = cleanText(text, '차량가격');
            if (text.includes('연식') || text.includes('년식')) {
              if (!year)
                year = cleanText(text, text.includes('연식') ? '연식' : '년식');
            }
            if (text.includes('적산거리') || text.includes('주행거리')) {
              if (!mileage)
                mileage = cleanText(
                  text,
                  text.includes('적산거리') ? '적산거리' : '주행거리'
                );
            }
          });
        } catch (e) {
          console.error(`   ㄴ상세 페이지 에러: ${e.message}`);
        }

        await saveToDB({
          title: `[중검단] ${post.title}`,
          price,
          year,
          mileage,
          location: '전국(인증)',
          source: 'junggeomdan',
          external_link: post.link,
          image_url: imageUrl,
        });
      }
    }
  } catch (error) {
    console.error('⚠️ [중검단] 에러:', error.message);
  }
}

// ==========================================
// 2️⃣ 바이크튜닝매니아 (모바일 리스트 -> 상세 파싱)
// ==========================================
async function crawlBatumae(menuId, categoryName) {
  console.log(`🔄 [바튜매-${categoryName}] 크롤링 시작...`);
  try {
    const url = `https://m.cafe.naver.com/SectionArticleList.nhn?cafeId=10312966&menuId=${menuId}`;
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(html);
    const items = $('li.board_box');

    // 상위 5개 글만 확인
    for (let i = 0; i < 5; i++) {
      const el = items[i];
      if (!el) break;

      const title = $(el).find('strong.tit').text().trim();
      const articleId = $(el)
        .find('a.txt_area')
        .attr('href')
        .split('articleid=')[1]
        .split('&')[0];
      const link = `https://cafe.naver.com/bikecargogo/${articleId}`; // PC 링크 저장
      const mobileDetailLink = `https://m.cafe.naver.com/bikecargogo/${articleId}`;

      const { data: existing } = await supabase
        .from('market')
        .select('id')
        .eq('external_link', link)
        .single();

      if (!existing) {
        let price = '가격 문의';
        let imageUrl = null;
        let year = '';
        let mileage = '';

        try {
          const { data: detailHtml } = await axios.get(mobileDetailLink, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          const $$ = cheerio.load(detailHtml);

          // 📸 이미지
          const firstImg = $$(
            'div.se-main-container img, div.post_content img'
          ).first();
          if (firstImg.length) imageUrl = firstImg.attr('src');

          // 🔍 정보 파싱
          $$('p, span, div, strong').each((j, elem) => {
            const text = $$(elem).text();
            if (text.includes('판매 희망가격') || text.includes('판매희망가격'))
              price = cleanText(text, '희망가격');
            if (text.includes('제작연식') || text.includes('년식')) {
              if (!year) year = cleanText(text, '연식');
            }
            if (text.includes('적산거리') || text.includes('주행거리')) {
              if (!mileage) mileage = cleanText(text, '거리');
            }
          });
        } catch (e) {
          console.error(`   ㄴ상세 파싱 에러: ${e.message}`);
        }

        await saveToDB({
          title: `[바튜매] ${title}`,
          price,
          year,
          mileage,
          location: categoryName,
          source: 'batumae',
          external_link: link,
          image_url: imageUrl,
        });
      }
    }
  } catch (error) {
    console.error(`⚠️ [바튜매] 에러:`, error.message);
  }
}

// 💾 DB 저장 공통 함수
async function saveToDB(item) {
  // 데이터 길이 안전장치
  const cleanYear = item.year ? item.year.substring(0, 30) : '';
  const cleanMileage = item.mileage ? item.mileage.substring(0, 30) : '';

  const { error } = await supabase.from('market').insert({
    title: item.title,
    price: item.price,
    location: item.location,
    source: item.source,
    external_link: item.external_link,
    image_url: item.image_url,
    status: '판매중',
    year: cleanYear,
    mileage: cleanMileage,
  });

  if (error) console.error('❌ 저장 실패:', error.message);
  else console.log(`✅ 등록 완료: ${item.title}`);
}

// 🚀 실행
async function run() {
  await crawlJunggeomdan();
  await crawlBatumae(302, '125cc 미만');
  await crawlBatumae(272, '125cc 초과');
}

run();
