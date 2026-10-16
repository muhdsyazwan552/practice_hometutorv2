import useMarketingCopy from './useMarketingCopy';
import HomeTutorPlaySection from './HomeTutorPlaySection';
import '../../../css/legacy-home.css';
import '../../../css/home-hero-update.css';
import '../../../css/home-atmosphere.css';

// Static public Home content from hometutor.com.my/portal_modules/home.html.
// Scripts, commented-out sections and the shared header were removed at import time.
// Original sections are retained. The hero uses the latest user-supplied wording, banner artwork and student portrait.
const homeMarkup = `
<section class="lh-hero">
    <div class="lh-hero-backdrop" aria-hidden="true"><img src="/images/landing-practice/hometutor-hero-background.png" alt="" width="1596" height="985" decoding="async" fetchpriority="high"></div>
    <div class="lh-hero-ambient" aria-hidden="true"><span class="lh-ambient-blue"></span><span class="lh-ambient-purple"></span></div>
    <div class="lh-hero-inner">

        <div class="lh-hero-overlay">
            <div class="lh-hero-content">
                <div class="lh-hero-badge">One Platform. Online Classes. <span class="lh-gradient">Unlimited Learning Opportunities.</span></div>
                <h1 class="lh-hero-title">
                    MALAYSIA'S ALL-IN-ONE <span class="lh-gradient">ONLINE LEARNING PLATFORM</span>
                </h1>
                <p class="lh-hero-desc">Give your child easy access to interactive online classes, engaging practice exercises, and essential learning resources—all in one convenient platform.</p>
                <a href="/register" class="lh-btn-red">
                    Langgan Sekarang &#8594;
                </a>
                <div class="lh-trust-row">

                    <div class="lh-trust-pill">
                        <span class="icon-red">&#128101;</span> 100K+ Pelajar
                    </div>
                    <div class="lh-trust-pill">
                        <span class="icon-yellow">&#9889;</span> Akses 24/7
                    </div>
                </div>
            </div>
        </div>
        <div class="lh-hero-portrait">
            <img src="/images/landing-practice/hero-students-banner-v3.png" alt="Two students showing HomeTutor practice exercises on a phone and tablet." width="963" height="709" decoding="async" fetchpriority="high">
        </div>
    </div>
</section>

<section class="lh-features">
    <div class="lh-wrap">
        <div class="lh-center">
            <p class="lh-label">— Apa yang anak anda akan dapat —</p>
            <h2 class="lh-heading">Empat pengalaman pembelajaran dalam satu ekosistem lengkap.</h2>
        </div>
        <div class="lh-grid-4">

            <div class="lh-fcard">
                <div class="lh-fcard-img"><img src="/legacy-site/img/img_revised/practice.png" alt="Practice" width="1394" height="752" decoding="async" loading="lazy"></div>
                <div class="lh-fcard-body">
                    <small>HomeTutor</small>
                    <h3 class="c-blue">Practice</h3>
                    <ul>
                        <li><span class="lh-chk blue">&#10003;</span> Latih Tubi Interaktif</li>
                        <li><span class="lh-chk blue">&#10003;</span> Assessment &amp; Kuiz</li>
                        <li><span class="lh-chk blue">&#10003;</span> Mastery Learning</li>
                    </ul>
                    <a href="/products" class="lh-btn-outline blue">Terokai Practice</a>
                </div>
            </div>

            <div class="lh-fcard">
                <div class="lh-fcard-img"><img src="/legacy-site/img/img_revised/live.png" alt="Live" width="1394" height="752" decoding="async" loading="lazy"></div>
                <div class="lh-fcard-body">
                    <small>HomeTutor</small>
                    <h3 class="c-red">Live</h3>
                    <ul>
                        <li><span class="lh-chk red">&#10003;</span> Live Teaching Class</li>
                        <li><span class="lh-chk red">&#10003;</span> Recorded Class</li>
                        <li><span class="lh-chk red">&#10003;</span> Tutor Interaction</li>
                    </ul>
                    <a href="/products" class="lh-btn-outline red">Terokai Live</a>
                </div>
            </div>

            <div class="lh-fcard">
                <div class="lh-fcard-img"><img src="/legacy-site/img/img_revised/ai.png" alt="AI" width="1394" height="752" decoding="async" loading="lazy"></div>
                <div class="lh-fcard-body">
                    <small>HomeTutor</small>
                    <h3 class="c-blue">AI</h3>
                    <ul>
                        <li><span class="lh-chk blue">&#10003;</span> AI Tutor</li>
                        <li><span class="lh-chk blue">&#10003;</span> AI Study Coach</li>
                        <li><span class="lh-chk blue">&#10003;</span> AI Learning Assistant</li>
                    </ul>
                    <a href="/products" class="lh-btn-outline blue">Terokai AI</a>
                </div>
            </div>

            <div class="lh-fcard">
                <div class="lh-fcard-img"><img src="/legacy-site/img/img_revised/parent.png" alt="Parent" width="1394" height="752" decoding="async" loading="lazy"></div>
                <div class="lh-fcard-body">
                    <small>HomeTutor</small>
                    <h3 class="c-red">Parent</h3>
                    <ul>
                        <li><span class="lh-chk red">&#10003;</span> Parent Dashboard</li>
                        <li><span class="lh-chk red">&#10003;</span> Learning Analytics</li>
                        <li><span class="lh-chk red">&#10003;</span> Progress Tracking</li>
                    </ul>
                    <a href="/products" class="lh-btn-outline red">Terokai Parent</a>
                </div>
            </div>

        </div>
    </div>
</section>

<section id="cara" class="lh-process">
    <div class="lh-wrap">
        <div class="lh-title-row">
            <div class="lh-title-line"></div>
            <h2>Bagaimana Pembelajaran Berfungsi?</h2>
            <div class="lh-title-line"></div>
        </div>
        <div class="lh-flow">
            <div class="lh-step">
                <div class="lh-step-img"><img src="/legacy-site/img/img_revised/step-video.png" alt="Video" width="2380" height="2380" decoding="async" loading="lazy"></div>
                <div class="lh-step-title"><span class="lh-step-num">1</span> Video Pembelajaran</div>
                <p class="lh-step-desc">Belajar konsep dengan penerangan yang mudah</p>
            </div>
            <div class="lh-arrow">&#8594;</div>
            <div class="lh-step">
                <div class="lh-step-img"><img src="/legacy-site/img/img_revised/step-notes.png" alt="Nota" width="2380" height="2380" decoding="async" loading="lazy"></div>
                <div class="lh-step-title"><span class="lh-step-num">2</span> Nota Interaktif</div>
                <p class="lh-step-desc">Nota ringkas dan padat untuk rujukan cepat</p>
            </div>
            <div class="lh-arrow">&#8594;</div>
            <div class="lh-step">
                <div class="lh-step-img"><img src="/legacy-site/img/img_revised/step-quiz.png" alt="Kuiz" width="2380" height="2380" decoding="async" loading="lazy"></div>
                <div class="lh-step-title"><span class="lh-step-num">3</span> Latihan &amp; Kuiz</div>
                <p class="lh-step-desc">Latihan interaktif untuk uji kefahaman</p>
            </div>
            <div class="lh-arrow">&#8594;</div>
            <div class="lh-step">
                <div class="lh-step-img"><img src="/legacy-site/img/img_revised/step-assessment.png" alt="Penilaian" width="2380" height="2380" decoding="async" loading="lazy"></div>
                <div class="lh-step-title"><span class="lh-step-num">4</span> Penilaian</div>
                <p class="lh-step-desc">Ujian &amp; peperiksaan mengikut topik</p>
            </div>
            <div class="lh-arrow">&#8594;</div>
            <div class="lh-step">
                <div class="lh-step-img"><img src="/legacy-site/img/img_revised/step-report.png" alt="Laporan" width="2380" height="2380" decoding="async" loading="lazy"></div>
                <div class="lh-step-title"><span class="lh-step-num">5</span> Laporan Prestasi</div>
                <p class="lh-step-desc">Analisis prestasi yang jelas dan terperinci</p>
            </div>
            <div class="lh-arrow">&#8594;</div>
            <div class="lh-step">
                <div class="lh-step-img"><img src="/legacy-site/img/img_revised/step-rocket.png" alt="Keyakinan" width="2380" height="2380" decoding="async" loading="lazy"></div>
                <div class="lh-step-title"><span class="lh-step-num">6</span> Peningkatan Keyakinan</div>
                <p class="lh-step-desc">Pemahaman lebih baik, prestasi meningkat</p>
            </div>
        </div>
    </div>
</section>

<section class="lh-stats">
    <div class="lh-wrap">
        <div class="lh-stats-card" id="htStatsCard">
            <div class="lh-glow blue"></div>
            <div class="lh-glow red"></div>
            <div class="lh-stats-grid">
                <div class="lh-stat">
                    <div class="lh-stat-icon blue">&#127909;</div>
                    <div class="lh-stat-num"><span class="lh-cnt" data-target="1500">1,500</span>+</div>
                    <div class="lh-stat-label">Video HD Interaktif</div>
                </div>
                <div class="lh-stat">
                    <div class="lh-stat-icon red">&#9998;</div>
                    <div class="lh-stat-num"><span class="lh-cnt" data-target="80000">80,000</span>+</div>
                    <div class="lh-stat-label">Bank Soalan Latihan</div>
                </div>
                <div class="lh-stat">
                    <div class="lh-stat-icon blue">&#128101;</div>
                    <div class="lh-stat-num"><span class="lh-cnt" data-target="120">120</span>K+</div>
                    <div class="lh-stat-label">Pengguna Aktif</div>
                </div>
                <div class="lh-stat">
                    <div class="lh-stat-icon yellow">&#9733;</div>
                    <div class="lh-stat-num"><span class="lh-cnt-dec" data-target="4.9">4.9</span>/5</div>
                    <div class="lh-stat-label">Rating Ibu Bapa</div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="lh-why">
    <div class="lh-wrap">
        <div class="lh-title-row">
            <div class="lh-title-line"></div>
            <h2>Kenapa Ibu Bapa Memilih HomeTutor?</h2>
            <div class="lh-title-line"></div>
        </div>
        <div class="lh-why-grid">
            <div class="lh-wcard orange">
                <div class="lh-wcard-img"><img src="/legacy-site/img/img_revised/jimat-masa.png" alt="Jimat Masa" width="1024" height="1024" decoding="async" loading="lazy"></div>
                <div class="lh-wcard-body">
                    <h5>Jimat Masa</h5>
                    <p>Tiada perjalanan ke pusat tuisyen. Belajar dari rumah lebih mudah &amp; selesa.</p>
                </div>
            </div>
            <div class="lh-wcard blue-s">
                <div class="lh-wcard-img"><img src="/legacy-site/img/img_revised/jimat-kos.png" alt="Jimat Kos" width="1024" height="1024" decoding="async" loading="lazy"></div>
                <div class="lh-wcard-body">
                    <h5>Jimat Kos</h5>
                    <p>Satu langganan untuk semua subjek. Lebih berbaloi &amp; berkesan.</p>
                </div>
            </div>
            <div class="lh-wcard gray">
                <div class="lh-wcard-img"><img src="/legacy-site/img/img_revised/belajar-fleksibel.png" alt="Fleksibel" width="1024" height="1024" decoding="async" loading="lazy"></div>
                <div class="lh-wcard-body">
                    <h5>Belajar Fleksibel</h5>
                    <p>Belajar ikut masa sendiri. Ulangkaji bila-bila masa yang diperlukan.</p>
                </div>
            </div>
            <div class="lh-wcard purple">
                <div class="lh-wcard-img"><img src="/legacy-site/img/img_revised/pantau-prestasi.png" alt="Pantau" width="1024" height="1024" decoding="async" loading="lazy"></div>
                <div class="lh-wcard-body">
                    <h5>Pantau Prestasi</h5>
                    <p>Laporan lengkap membantu ibu bapa memantau kemajuan anak.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="lh-testi">
    <div class="lh-wrap">
        <div class="lh-title-row">
            <div class="lh-title-line"></div>
            <h2>Dipercayai Oleh Ribuan Ibu Bapa</h2>
            <div class="lh-title-line"></div>
        </div>
        <div class="lh-testi-grid">
            <div class="lh-tcard">
                <div class="lh-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p class="lh-tcard-text">"Sistem ni memang life-saver! Anak saya dulu susah nak fokus Math, sekarang dia sendiri yang bukak HomeTutor nak buat kuiz."</p>
                <hr class="lh-tcard-hr">
                <div class="lh-tcard-user">
                    <div class="lh-tavatar blue">F</div>
                    <div>
                        <div class="lh-tname">Puan Farah Liyana</div>
                        <div class="lh-trole">Ibu Pelajar Tingkatan 3</div>
                    </div>
                </div>
            </div>
            <div class="lh-tcard">
                <div class="lh-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p class="lh-tcard-text">"Paling suka fungsi report card dia. Saya kerja luar kawasan pun masih boleh pantau berapa jam anak belajar dan tengok result ujian dia dari fon je."</p>
                <hr class="lh-tcard-hr">
                <div class="lh-tcard-user">
                    <div class="lh-tavatar red">A</div>
                    <div>
                        <div class="lh-tname">En. Azman Hashim</div>
                        <div class="lh-trole">Bapa Pelajar Tahun 6</div>
                    </div>
                </div>
            </div>
            <div class="lh-tcard">
                <div class="lh-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p class="lh-tcard-text">"Video penerangan cikgu sangat jelas dan tak meleret. Anak saya Form 5 guna ni untuk pecutan SPM. Berbaloi sangat dengan harga langganan bulanan."</p>
                <hr class="lh-tcard-hr">
                <div class="lh-tcard-user">
                    <div class="lh-tavatar blue">S</div>
                    <div>
                        <div class="lh-tname">Puan Siti Sarah</div>
                        <div class="lh-trole">Ibu Pelajar Tingkatan 5</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section id="grade-level" class="section grade-level">
    <div class="lh-wrap">
        <div class="lh-center" style="margin-bottom:30px;">
            <h3 class="title-heading">Terokai Pakej Hometutor</h3>
        </div>
        <div class="grade-row">
            <div class="grade-col">
                <a href="/products?target=productA">
                    <div class="lh-package-card"><h4>LEVEL 1</h4><p>Tahun 1–3</p><div class="lh-package-art"><img src="/legacy-site/img/img_revised/3_Level01.png" class="image-grade" aria-hidden="true" alt="" width="484" height="615" decoding="async" loading="lazy"></div></div>
                </a>
            </div>
            <div class="grade-col">
                <a href="/products?target=productB">
                    <div class="lh-package-card"><h4>LEVEL 2</h4><p>Tahun 4–6</p><div class="lh-package-art"><img src="/legacy-site/img/img_revised/4_Level02.png" class="image-grade" aria-hidden="true" alt="" width="484" height="615" decoding="async" loading="lazy"></div></div>
                </a>
            </div>
            <div class="grade-col">
                <a href="/products?target=productC">
                    <div class="lh-package-card"><h4>LOWER SECONDARY</h4><p>Ting 1–3</p><div class="lh-package-art"><img src="/legacy-site/img/img_revised/5_LowerSec.png" class="image-grade" aria-hidden="true" alt="" width="484" height="615" decoding="async" loading="lazy"></div></div>
                </a>
            </div>
            <div class="grade-col">
                <a href="/products?target=productD">
                    <div class="lh-package-card"><h4>UPPER SECONDARY</h4><p>Ting 4–5</p><div class="lh-package-art"><img src="/legacy-site/img/img_revised/6_UppSec.png" class="image-grade" aria-hidden="true" alt="" width="484" height="615" decoding="async" loading="lazy"></div></div>
                </a>
            </div>
        </div>
    </div>
</section>
`;

const playInsertion = homeMarkup.indexOf('<section class="lh-stats">');

export default function LegacyHome() {
    const { html } = useMarketingCopy();
    return <>
        <div className="legacy-home" dangerouslySetInnerHTML={{ __html: html(homeMarkup.slice(0, playInsertion)) }} />
        <HomeTutorPlaySection />
        <div className="legacy-home" dangerouslySetInnerHTML={{ __html: html(homeMarkup.slice(playInsertion)) }} />
    </>;
}
