import { useState } from 'react';
import { Link } from '@inertiajs/react';
import tutors from './tutors.json';
import ScreenshotGallery from './ScreenshotGallery';

const legacyProducts = 'https://hometutor.com.my/?page=portal_modules/products';
const tutorDirectory = 'https://xoom.xcelearn.com.my/view-tutors';

export function PracticeDemo() {
    const [answer, setAnswer] = useState(null);
    const [checked, setChecked] = useState(false);
    const correct = answer === 2;

    return (
        <div className="ht-demo" id="demo-latihan">
            <div className="ht-demo-toolbar">
                <img className="ht-demo-brand" src="/images/landing-practice/ht-logo.webp" alt="" width="46" height="32" />
                <span>HomeTutor <strong>Practice</strong></span>
                <span className="ht-demo-tag">Demo interaktif</span>
            </div>
            <div className="ht-demo-body">
                <div className="ht-demo-meta"><span>MATEMATIK · PECAHAN</span><span>01 / 01</span></div>
                <div className="ht-demo-progress" aria-hidden="true"><span style={{ width: checked && correct ? '100%' : '0%' }} /></div>
                <fieldset>
                    <legend><span className="ht-demo-prompt">Jom cuba satu soalan.</span><span>Berapakah <span className="ht-fraction">½</span> + <span className="ht-fraction">¼</span> ?</span></legend>
                    <p className="ht-demo-hint">Pilih jawapan, kemudian semak.</p>
                    <div className="ht-answer-grid">
                        {['¼', '½', '¾', '1'].map((value, index) => (
                            <label key={value} className={`ht-answer ${answer === index ? 'is-selected' : ''} ${checked && answer === index ? correct ? 'is-correct' : 'is-incorrect' : ''}`}>
                                <input type="radio" name="hero-practice-answer" value={index} checked={answer === index} onChange={() => { setAnswer(index); setChecked(false); }} />
                                <span className="ht-answer-letter">{String.fromCharCode(65 + index)}</span>
                                <span className="ht-answer-value">{value}</span>
                                <span className="ht-answer-indicator" aria-hidden="true">{answer === index ? '●' : '○'}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <div className={`ht-demo-feedback ${checked ? correct ? 'is-correct' : 'is-incorrect' : ''}`} role="status" aria-live="polite" aria-atomic="true">
                    {checked ? <><strong>{correct ? 'Tepat! Bagus sekali.' : 'Hampir! Cuba samakan penyebut.'}</strong><span>½ = ²⁄₄. Jadi, ²⁄₄ + ¼ = ¾.</span></> : <><strong>Belajar dengan mencuba.</strong><span>Semak jawapan dan fahami langkahnya.</span></>}
                </div>
                <div className="ht-demo-actions">
                    <button type="button" onClick={() => { setAnswer(null); setChecked(false); }} className="ht-demo-reset">Mula semula ↺</button>
                    <button type="button" disabled={answer === null} onClick={() => setChecked(true)} className="ht-solid-button">Semak jawapan <span aria-hidden="true">→</span></button>
                </div>
            </div>
            <div className="ht-demo-caption"><span aria-hidden="true">✦</span> Contoh latihan · Jawapan demo tidak disimpan</div>
        </div>
    );
}

export function ProductHero() {
    return (
        <section id="top" className="ht-hero ht-hero-showcase">
            <div className="ht-hero-atmosphere" aria-hidden="true"><div /><div /><div /></div>
            <div className="ht-hero-copy">
                <p className="ht-hero-badge"><span>KENALI HOMETUTOR</span> Dunia belajar anak, dalam satu platform.</p>
                <h1>Anak seronok belajar.<br /><span>Ibu bapa nampak kemajuan.</span></h1>
                <p className="ht-hero-description">Latihan, misi, permainan dan perkembangan anak. Lihat sendiri ruang belajar HomeTutor—kemudian cuba satu soalan.</p>
                <div className="ht-hero-actions">
                    <Link href={route('register')} className="ht-solid-button">Mula sekarang <span aria-hidden="true">↗</span></Link>
                    <a href="#produk" className="ht-hero-explore">Terokai produk <span aria-hidden="true">↓</span></a>
                </div>
                <div className="ht-hero-note"><span>Tahun 1 — Tingkatan 5</span><span>Semakan serta-merta</span><span>Portal ibu bapa</span></div>
            </div>
            <div className="ht-hero-experience">
                <ScreenshotGallery />
                <div className="ht-hero-demo-column">
                    <div className="ht-demo-intro"><span><i aria-hidden="true" /> SEKARANG, GILIRAN ANDA.</span><span>Cuba terus di sini ↘</span></div>
                    <PracticeDemo />
                    <p className="ht-demo-invite"><span aria-hidden="true">✦</span> Satu soalan kecil. Permulaan kepada lebih banyak “saya boleh”.</p>
                </div>
            </div>
            <div className="ht-hero-bottom"><span>FAHAMI. CUBA. SEMAK. KUASAI.</span><a href="#cara">Kenali cara anak belajar <span aria-hidden="true">↓</span></a></div>
        </section>
    );
}

const products = [
    { id: 'practice', name: 'Practice', verb: 'Cuba. Faham. Kuasai.', category: 'LATIHAN KENDIRI', description: 'Mulakan dengan satu topik. Jawab soalan, semak jawapan dan ulang kaji bahagian yang masih mencabar. Setiap latihan membantu anak mengenal pasti apa yang sudah difahami.', features: ['Latihan objektif & subjektif', 'Semakan serta-merta', 'Cabaran mastery & Quiz Arena'], href: '#cara', cta: 'Lihat cara belajar', note: 'Terokai latihan dalam HomeTutor Practice.', color: 'blue' },
    { id: 'live', name: 'Live', verb: 'Ada cikgu untuk membimbing.', category: 'BELAJAR BERSAMA TUTOR', description: 'Kenali pilihan pembelajaran bersama tutor dalam ekosistem HomeTutor. Terokai maklumat kelas dan rakaman di laman produk, atau lihat profil tutor untuk mencari pendekatan yang sesuai.', features: ['Kelas secara langsung', 'Rakaman pembelajaran', 'Interaksi dengan tutor'], href: legacyProducts, cta: 'Terokai HomeTutor Live', note: 'Maklumat kelas dan akses di laman HomeTutor.', color: 'rose' },
    { id: 'ai', name: 'AI', verb: 'Sokongan untuk rasa ingin tahu.', category: 'BANTUAN PEMBELAJARAN', description: 'Kenali HomeTutor AI dan pendekatannya untuk menyokong pembelajaran anak. Laman produk HomeTutor menerangkan pilihan AI Tutor, Study Coach dan Learning Assistant.', features: ['AI Tutor', 'AI Study Coach', 'AI Learning Assistant'], href: legacyProducts, cta: 'Kenali HomeTutor AI', note: 'Rujuk laman produk untuk ketersediaan dan akses AI.', color: 'violet' },
    { id: 'parent', name: 'Parent', verb: 'Dekat dengan perkembangan anak.', category: 'UNTUK IBU BAPA', description: 'Lihat aktiviti pembelajaran dan kad laporan anak dalam satu tempat. Kenal pasti subjek yang memerlukan perhatian, kemudian bantu anak mengambil langkah seterusnya.', features: ['Dashboard ibu bapa', 'Laporan mengikut subjek', 'Pemantauan aktiviti anak'], href: route('register'), cta: 'Daftar akaun ibu bapa', note: 'Bermula dengan akaun ibu bapa di platform ini.', color: 'green' },
];

function ProductVisual({ product }) {
    if (product.id === 'practice') return (
        <div className="ht-product-visual ht-practice-visual" aria-label="Ilustrasi aliran latihan">
            <span className="ht-visual-label">SATU TOPIK. SATU LANGKAH KE HADAPAN.</span>
            <div className="ht-learning-path"><div><span>01</span><strong>Pilih topik</strong><small>Mulakan di tempat yang sesuai</small></div><div><span>02</span><strong>Cuba soalan</strong><small>Fikir, jawab dan semak</small></div><div><span>03</span><strong>Bina penguasaan</strong><small>Ulang kaji dan terus mencuba</small></div></div>
            <a href="#demo-latihan" className="ht-visual-link">Cuba demo di atas ↑</a>
        </div>
    );
    if (product.id === 'live') return (
        <div className="ht-product-visual ht-live-visual">
            <span className="ht-visual-label">KENALI WAJAH DI SEBALIK PEMBELAJARAN</span>
            <div className="ht-live-portraits">{tutors.slice(0, 3).map(tutor => <img key={tutor.name} src={tutor.image} alt={tutor.name} loading="lazy" width="400" height="400" />)}</div>
            <p>Setiap anak ada cara belajar.<br /><strong>Kenali tutor yang boleh membimbing.</strong></p>
            <a href={tutorDirectory} target="_blank" rel="noreferrer" className="ht-visual-link">Lihat direktori tutor Xcelearn Xoom ↗</a>
        </div>
    );
    if (product.id === 'ai') return (
        <div className="ht-product-visual ht-ai-visual">
            <span className="ht-visual-label">KENALI HOMETUTOR AI</span>
            <img src="/images/landing-practice/robo.webp" alt="Maskot HomeTutor" loading="lazy" width="180" height="180" />
            <div className="ht-ai-note"><span>Rasa ingin tahu bermula dengan…</span><strong>“Kenapa jawapannya begitu?”</strong></div>
            <p>Terokai peranan AI dalam perjalanan belajar anak.</p>
        </div>
    );
    return (
        <div className="ht-product-visual ht-parent-visual">
            <span className="ht-visual-label">APA YANG IBU BAPA BOLEH IKUTI</span>
            <h3>Gambaran yang lebih jelas.</h3>
            {[['01', 'Aktiviti pembelajaran', 'Ikuti rutin latihan anak.'], ['02', 'Laporan subjek', 'Kenali bahagian yang perlu perhatian.'], ['03', 'Langkah seterusnya', 'Beri sokongan dengan lebih terarah.']].map(([number, title, detail]) => <div className="ht-report-row" key={number}><span>{number}</span><div><strong>{title}</strong><p>{detail}</p></div><span aria-hidden="true">↗</span></div>)}
        </div>
    );
}

export function ProductsSection() {
    const [selected, setSelected] = useState('practice');
    const product = products.find(item => item.id === selected);
    return (
        <section id="produk" className="ht-section ht-products">
            <div className="ht-section-heading"><div><p className="ht-eyebrow">01 / PRODUK KAMI</p><h2>Banyak cara belajar.<br /><span>Satu tujuan: anak lebih faham.</span></h2></div><p>Latihan sendiri, bimbingan tutor dan sokongan ibu bapa. Kenali peranan setiap produk dalam perjalanan anak.</p></div>
            <div className="ht-product-selector" role="group" aria-label="Pilih produk HomeTutor">{products.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === item.id} aria-controls="ht-product-content" onClick={() => setSelected(item.id)} className={selected === item.id ? 'is-active' : ''}><span>0{index + 1}</span><span><small>HomeTutor</small>{item.name}</span><span aria-hidden="true">↗</span></button>)}</div>
            <div id="ht-product-content" className={`ht-product-panel ht-tone-${product.color}`}>
                <div className="ht-product-copy" aria-live="polite" aria-atomic="true"><p className="ht-eyebrow">{product.category}</p><h3>{product.verb}</h3><p>{product.description}</p><ul>{product.features.map(feature => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul><a className="ht-solid-button" href={product.href} {...(product.href.startsWith('https://hometutor.com.my') ? { target: '_blank', rel: 'noreferrer' } : {})}>{product.cta}<span aria-hidden="true">↗</span></a><small className="ht-product-note">{product.note}</small></div>
                <ProductVisual product={product} />
            </div>
            <a href="#play" className="ht-play-ribbon"><span className="ht-play-star" aria-hidden="true">✦</span><span><strong>Belajar juga boleh jadi waktu bermain.</strong><span>Kenali HomeTutor Play, dunia permainan pembelajaran kami.</span></span><span className="ht-ribbon-arrow" aria-hidden="true">↗</span></a>
        </section>
    );
}

export function AboutSection() {
    return (
        <section id="tentang" className="ht-about">
            <div className="ht-section">
                <div className="ht-about-intro"><div><p className="ht-eyebrow">02 / TENTANG HOMETUTOR</p><h2>Teknologi membantu.<br /><span>Manusia membimbing.</span></h2></div><div><p className="ht-about-lead">Kami percaya belajar bukan sekadar mendapat jawapan yang betul. Ia juga tentang membina keyakinan untuk mencuba lagi.</p><p>HomeTutor menggabungkan kandungan digital dan latihan untuk membantu anak belajar secara kendiri. Anak mengenal pasti apa yang belum difahami, membina rutin dan bergerak mengikut rentak sendiri—dengan sokongan ibu bapa.</p><a href="https://hometutor.com.my/?page=portal_modules/about" target="_blank" rel="noreferrer" className="ht-text-link">Kenali pendekatan HomeTutor ↗</a></div></div>
                <div className="ht-values"><div><span>01 — KENDIRI</span><h3>Ruang untuk mencuba.</h3><p>Anak mengambil peranan aktif dalam pembelajarannya.</p></div><div><span>02 — BERPANDU</span><h3>Faham langkahnya.</h3><p>Latihan dan semakan membantu anak mengenali ruang penambahbaikan.</p></div><div><span>03 — BERSAMA</span><h3>Sokongan yang dekat.</h3><p>Ibu bapa mengikuti perkembangan dan membantu membina rutin.</p></div></div>
                <div className="ht-tutor-heading"><div><p className="ht-eyebrow">KENALI PARA PENDIDIK</p><h3>Wajah sebenar. Semangat mengajar.</h3></div><a href={tutorDirectory} className="ht-text-link" target="_blank" rel="noreferrer">Semua tutor di Xcelearn Xoom ↗</a></div>
                <div className="ht-tutor-grid">{tutors.map((tutor, index) => <a className="ht-tutor" key={tutor.name} href={tutor.url} target="_blank" rel="noreferrer"><div className={`ht-tutor-photo ht-tutor-photo-${index}`}><img src={tutor.image} alt={`Potret ${tutor.name}`} width="400" height="400" loading="lazy" decoding="async" /><span aria-hidden="true">↗</span></div><h4>{tutor.name}</h4><p>{tutor.headline}</p><span className="ht-tutor-profile">Lihat profil tutor</span></a>)}</div>
                <p className="ht-tutor-source">Profil dan foto daripada direktori tutor Xcelearn Xoom. Lihat profil untuk maklumat pengajaran terkini.</p>
            </div>
        </section>
    );
}

const faqs = [
    { category: 'Mula di sini', question: 'Apa itu HomeTutor?', answer: 'HomeTutor ialah platform pembelajaran digital yang membantu anak belajar melalui latihan dan ulang kaji. Dalam HomeTutor Practice, anak boleh berlatih mengikut subjek, menyemak jawapan dan membina penguasaan, manakala ibu bapa mengikuti perkembangan mereka.' },
    { category: 'Mula di sini', question: 'Sesuai untuk anak di tahap mana?', answer: 'HomeTutor Practice merangkumi Tahun 1 hingga Tingkatan 5. Pilih pakej mengikut tahap persekolahan anak. Subjek dan kandungan yang boleh diakses bergantung pada pakej yang dipilih.' },
    { category: 'Mula di sini', question: 'Bagaimana hendak mula?', answer: 'Daftar akaun ibu bapa, tambah profil anak dan pilih pakej yang sesuai. Ikuti arahan langganan dalam portal, kemudian gunakan akaun anak untuk memulakan latihan.' },
    { category: 'Pembelajaran', question: 'Perlu ikut jadual tertentu untuk berlatih?', answer: 'Latihan kendiri boleh dibuat mengikut masa yang sesuai untuk anak. Mulakan dengan satu topik, semak jawapan dan ulang kaji bahagian yang memerlukan perhatian. Kelas langsung mempunyai aturan dan jadualnya sendiri.' },
    { category: 'Pembelajaran', question: 'Boleh guna telefon atau tablet?', answer: 'Anda boleh membuka HomeTutor melalui pelayar pada telefon, tablet atau komputer dengan sambungan internet. Skrin yang lebih besar lebih selesa untuk membaca soalan panjang dan menggunakan alat pembelajaran.' },
    { category: 'Pembelajaran', question: 'Apa beza Practice, Play, Live dan AI?', answer: 'Practice memfokuskan latihan dan penguasaan subjek. Play menawarkan permainan pembelajaran. Live dan AI ialah pilihan dalam ekosistem HomeTutor; rujuk laman produk masing-masing untuk ketersediaan, pakej dan akses. Pilihan dan akses bergantung pada pakej yang dilanggan.' },
    { category: 'Ibu bapa & akaun', question: 'Bagaimana saya boleh pantau anak?', answer: 'Gunakan portal ibu bapa untuk melihat aktiviti pembelajaran, laporan subjek dan kad laporan anak. Maklumat ini membantu anda mengenal pasti bahagian yang memerlukan sokongan.' },
    { category: 'Ibu bapa & akaun', question: 'Perlu akaun lain untuk HomeTutor Play?', answer: 'HomeTutor Play boleh dibuka melalui akaun HomeTutor yang sama. Log masuk dahulu, kemudian pilih HomeTutor Play untuk meneruskan ke platform permainan.' },
    { category: 'Ibu bapa & akaun', question: 'Di mana boleh semak pakej atau dapatkan bantuan?', answer: 'Semak pilihan pakej dan harga semasa dalam portal semasa pendaftaran atau pengurusan langganan. Untuk bantuan akaun dan pertanyaan langganan, hubungi support@hometutor.com.my.', contact: true },
];

export function FaqSection() {
    const [category, setCategory] = useState('Mula di sini');
    const [open, setOpen] = useState(faqs[0].question);
    const categories = [...new Set(faqs.map(item => item.category))];
    return (
        <section id="faq" className="ht-section ht-faq">
            <div className="ht-faq-intro"><p className="ht-eyebrow">03 / SOALAN LAZIM</p><h2>Biar jelas,<br /><span>sebelum bermula.</span></h2><p>Perkara yang ibu bapa ingin tahu tentang belajar bersama HomeTutor.</p><a href="mailto:support@hometutor.com.my" className="ht-text-link">Tanya pasukan kami ↗</a></div>
            <div className="ht-faq-content"><div className="ht-faq-categories" role="group" aria-label="Kategori soalan">{categories.map(item => <button key={item} type="button" aria-pressed={item === category} className={item === category ? 'is-active' : ''} onClick={() => { setCategory(item); setOpen(null); }}>{item}</button>)}</div><div className="ht-faq-list">{faqs.filter(item => item.category === category).map(item => { const index = faqs.indexOf(item); const expanded = open === item.question; return <div className={`ht-faq-item ${expanded ? 'is-open' : ''}`} key={item.question}><h3><button id={`faq-question-${index}`} type="button" aria-expanded={expanded} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(expanded ? null : item.question)}><span>{item.question}</span><span aria-hidden="true">{expanded ? '−' : '+'}</span></button></h3><div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={!expanded}><p>{item.answer}</p>{item.contact && <a href="mailto:support@hometutor.com.my" className="ht-text-link">E-mel sokongan ↗</a>}</div></div>; })}</div></div>
        </section>
    );
}
