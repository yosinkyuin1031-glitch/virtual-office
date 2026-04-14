'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================
// Types
// ============================================================
interface PatientVoice {
  name: string;
  age: string;
  symptom: string;
  comment: string;
  image: string;
}

interface ChirashiData {
  id: string;
  title: string;
  updatedAt: string;
  template: 'front' | 'back';
  clinicName: string;
  address: string;
  zipCode: string;
  phone: string;
  lineId: string;
  nearestStation: string;
  mainSymptom: string;
  mainCopy: string;
  subCopy: string;
  worries: string[];
  normalPrice: string;
  specialPrice: string;
  discountRate: string;
  limitDays: string;
  methodName: string;
  headerCopy: string;
  inspectionDescription: string;
  doctorRecommendation: string;
  methodDescription: string;
  patientVoices: PatientVoice[];
  patientImages: string[];
  heroImage: string;
}

const DEFAULT_DATA: ChirashiData = {
  id: '',
  title: '',
  updatedAt: '',
  template: 'front',
  clinicName: '大口神経整体院',
  address: '大阪市住吉区長居東4-2-7 長居中ビル304',
  zipCode: '〒558-0004',
  phone: '070-8498-2968',
  lineId: '',
  nearestStation: '地下鉄御堂筋線「長居駅」2番出口徒歩30秒',
  mainSymptom: '脊柱管狭窄症',
  mainCopy: '脊柱管狭窄症の激しい痛みと痺れ',
  subCopy: '諦めていたあなた、最後に確かめて下さい！その場で実感！',
  worries: [
    '長時間歩くと腰から足にかけて痛みや痺れが出る',
    '病院で手術を勧められたが、できれば避けたい',
    '薬やブロック注射を続けているが改善しない',
    '朝起き上がる時に腰が固まって動けない',
    '座っていても足の痺れが取れない',
    'このまま歩けなくなるのではと不安',
  ],
  normalPrice: '12,000',
  specialPrice: '2,980',
  discountRate: '約75%',
  limitDays: '7日間',
  methodName: '大口式神経整体法',
  headerCopy: '改善しない症状を治すには「根本原因」を見つけることが重要です',
  inspectionDescription: '当院では独自の神経検査法により、痛みや痺れの根本原因を特定します。医師からも推薦をいただいている検査法で、一般的な整体では見つけられない原因を見つけ出します。',
  doctorRecommendation: '「大口先生の検査法は、医学的根拠に基づいた素晴らしいアプローチです。私の患者さんにも自信を持って紹介しています。」',
  methodDescription: '神経の流れを整え、身体が本来持つ回復力を最大限に引き出す独自の施術法です。ボキボキしない、痛くない、優しい施術で根本改善を目指します。',
  patientVoices: [
    {
      name: 'T.K',
      age: '60代',
      symptom: '脊柱管狭窄症',
      comment: '手術しかないと言われていましたが、こちらに通い始めて3ヶ月で痛みがほぼなくなりました。今では毎日散歩を楽しんでいます。',
      image: '',
    },
    {
      name: 'S.M',
      age: '50代',
      symptom: '坐骨神経痛',
      comment: '10年以上悩んでいた坐骨神経痛が嘘のように改善しました。もっと早く来ればよかったです。',
      image: '',
    },
    {
      name: 'A.Y',
      age: '40代',
      symptom: '腰痛',
      comment: '他の整体院では一時的な改善しかなかったのに、ここでは根本から変わった実感があります。',
      image: '',
    },
  ],
  patientImages: ['', '', '', ''],
  heroImage: '',
};

const STORAGE_KEY = 'chirashi-builder-data';

// ============================================================
// Helper
// ============================================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadAll(): ChirashiData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(list: ChirashiData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ============================================================
// Component
// ============================================================
export default function ChirashiBuilderPage() {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [data, setData] = useState<ChirashiData>({ ...DEFAULT_DATA, id: generateId(), title: '新しいチラシ', updatedAt: new Date().toISOString() });
  const [saved, setSaved] = useState<ChirashiData[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(loadAll());
  }, []);

  const update = useCallback(<K extends keyof ChirashiData>(key: K, value: ChirashiData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    const now = new Date().toISOString();
    const updated = { ...data, updatedAt: now };
    setData(updated);
    const list = loadAll();
    const idx = list.findIndex(d => d.id === updated.id);
    if (idx >= 0) list[idx] = updated;
    else list.push(updated);
    saveAll(list);
    setSaved(list);
  };

  const handleNew = () => {
    setData({ ...DEFAULT_DATA, id: generateId(), title: '新しいチラシ', updatedAt: new Date().toISOString() });
    setMode('edit');
  };

  const handleEdit = (item: ChirashiData) => {
    setData(item);
    setMode('edit');
  };

  const handleDelete = (id: string) => {
    const list = loadAll().filter(d => d.id !== id);
    saveAll(list);
    setSaved(list);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrinting(false), 500);
    }, 300);
  };

  const handleImageUpload = (callback: (base64: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ============================================================
  // List View
  // ============================================================
  if (mode === 'list') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">チラシビルダー</h1>
              <p className="text-sm text-gray-500 mt-1">チラシの作成・編集・PDF出力</p>
            </div>
            <button
              onClick={handleNew}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + 新規作成
            </button>
          </div>

          {saved.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg mb-2">まだチラシがありません</p>
              <p className="text-sm">「新規作成」からチラシを作りましょう</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {saved.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.template === 'front' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item.template === 'front' ? '表面' : '裏面'}
                    </span>
                    <span className="text-xs text-gray-400">{item.mainSymptom}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{item.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    更新: {new Date(item.updatedAt).toLocaleDateString('ja-JP')}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="flex-1 text-sm py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                      編集
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-sm py-1.5 px-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // Edit View
  // ============================================================
  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #chirashi-print, #chirashi-print * { visibility: visible !important; }
          #chirashi-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div className={`min-h-screen bg-white ${isPrinting ? 'print-mode' : ''}`}>
        {/* Top bar */}
        <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('list')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              ← 一覧に戻る
            </button>
            <input
              value={data.title}
              onChange={e => update('title', e.target.value)}
              className="text-lg font-bold bg-transparent border-none outline-none text-gray-900"
              placeholder="チラシ名を入力"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              保存
            </button>
            <button onClick={handlePrint} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors">
              PDF出力
            </button>
          </div>
        </div>

        <div className="print:hidden flex">
          {/* ============ Preview (left) ============ */}
          <div className="flex-1 p-6 flex justify-center items-start overflow-auto bg-gray-50">
            <div className="w-full max-w-[600px]">
              <div
                ref={printRef}
                id="chirashi-print"
                className="bg-white shadow-lg"
                style={{ aspectRatio: '210/297', width: '100%', overflow: 'hidden' }}
              >
                {data.template === 'front' ? (
                  <FrontPreview data={data} onImageUpload={handleImageUpload} update={update} />
                ) : (
                  <BackPreview data={data} onImageUpload={handleImageUpload} update={update} />
                )}
              </div>
            </div>
          </div>

          {/* ============ Editor (right) ============ */}
          <div className="w-[420px] border-l border-gray-200 overflow-y-auto h-[calc(100vh-57px)] p-5 space-y-6">
            {/* Template toggle */}
            <Section title="テンプレート">
              <div className="flex gap-2">
                {(['front', 'back'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => update('template', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${data.template === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {t === 'front' ? '表面（症状訴求型）' : '裏面（信頼構築型）'}
                  </button>
                ))}
              </div>
            </Section>

            {/* Basic info */}
            <Section title="基本情報">
              <Field label="院名" value={data.clinicName} onChange={v => update('clinicName', v)} />
              <Field label="郵便番号" value={data.zipCode} onChange={v => update('zipCode', v)} />
              <Field label="住所" value={data.address} onChange={v => update('address', v)} />
              <Field label="電話番号" value={data.phone} onChange={v => update('phone', v)} />
              <Field label="最寄駅" value={data.nearestStation} onChange={v => update('nearestStation', v)} />
              <Field label="LINE ID" value={data.lineId} onChange={v => update('lineId', v)} />
            </Section>

            {data.template === 'front' ? (
              <>
                {/* Symptom & copy */}
                <Section title="症状・コピー">
                  <Field label="メイン症状名" value={data.mainSymptom} onChange={v => update('mainSymptom', v)} />
                  <Field label="メインコピー" value={data.mainCopy} onChange={v => update('mainCopy', v)} />
                  <Field label="サブコピー" value={data.subCopy} onChange={v => update('subCopy', v)} />
                </Section>

                {/* Worries */}
                <Section title="こんなお悩みありませんか？">
                  {data.worries.map((w, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        value={w}
                        onChange={e => {
                          const newW = [...data.worries];
                          newW[i] = e.target.value;
                          update('worries', newW);
                        }}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                      />
                      <button
                        onClick={() => update('worries', data.worries.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-lg leading-none mt-1.5"
                      >
                        x
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => update('worries', [...data.worries, ''])}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 項目を追加
                  </button>
                </Section>

                {/* Pricing */}
                <Section title="料金">
                  <Field label="通常価格" value={data.normalPrice} onChange={v => update('normalPrice', v)} />
                  <Field label="特別価格" value={data.specialPrice} onChange={v => update('specialPrice', v)} />
                  <Field label="割引率" value={data.discountRate} onChange={v => update('discountRate', v)} />
                  <Field label="期間" value={data.limitDays} onChange={v => update('limitDays', v)} />
                </Section>

                {/* Patient images */}
                <Section title="患者さんの写真（4枚）">
                  <div className="grid grid-cols-2 gap-2">
                    {data.patientImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => handleImageUpload(base64 => {
                          const newImgs = [...data.patientImages];
                          newImgs[i] = base64;
                          update('patientImages', newImgs);
                        })}
                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden hover:border-blue-400 transition-colors"
                      >
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-xs">クリックで追加</span>
                        )}
                      </button>
                    ))}
                  </div>
                </Section>
              </>
            ) : (
              <>
                {/* Back template fields */}
                <Section title="ヘッダー・施術法">
                  <Field label="ヘッダーコピー" value={data.headerCopy} onChange={v => update('headerCopy', v)} textarea />
                  <Field label="施術法名" value={data.methodName} onChange={v => update('methodName', v)} />
                  <Field label="施術法の説明" value={data.methodDescription} onChange={v => update('methodDescription', v)} textarea />
                </Section>

                <Section title="検査法・推薦">
                  <Field label="検査法の説明" value={data.inspectionDescription} onChange={v => update('inspectionDescription', v)} textarea />
                  <Field label="医師の推薦の声" value={data.doctorRecommendation} onChange={v => update('doctorRecommendation', v)} textarea />
                </Section>

                <Section title="料金">
                  <Field label="通常価格" value={data.normalPrice} onChange={v => update('normalPrice', v)} />
                  <Field label="特別価格" value={data.specialPrice} onChange={v => update('specialPrice', v)} />
                  <Field label="割引率" value={data.discountRate} onChange={v => update('discountRate', v)} />
                  <Field label="期間" value={data.limitDays} onChange={v => update('limitDays', v)} />
                </Section>

                {/* Patient voices */}
                <Section title="患者さんの声">
                  {data.patientVoices.map((v, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">#{i + 1}</span>
                        <button
                          onClick={() => update('patientVoices', data.patientVoices.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          削除
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input value={v.name} onChange={e => { const nv = [...data.patientVoices]; nv[i] = { ...nv[i], name: e.target.value }; update('patientVoices', nv); }} className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none" placeholder="名前" />
                        <input value={v.age} onChange={e => { const nv = [...data.patientVoices]; nv[i] = { ...nv[i], age: e.target.value }; update('patientVoices', nv); }} className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none" placeholder="年代" />
                        <input value={v.symptom} onChange={e => { const nv = [...data.patientVoices]; nv[i] = { ...nv[i], symptom: e.target.value }; update('patientVoices', nv); }} className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none" placeholder="症状" />
                      </div>
                      <textarea value={v.comment} onChange={e => { const nv = [...data.patientVoices]; nv[i] = { ...nv[i], comment: e.target.value }; update('patientVoices', nv); }} className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none resize-none" rows={2} placeholder="感想" />
                      <button
                        onClick={() => handleImageUpload(base64 => { const nv = [...data.patientVoices]; nv[i] = { ...nv[i], image: base64 }; update('patientVoices', nv); })}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {v.image ? '写真を変更' : '写真を追加'}
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => update('patientVoices', [...data.patientVoices, { name: '', age: '', symptom: '', comment: '', image: '' }])}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 患者の声を追加
                  </button>
                </Section>
              </>
            )}
          </div>
        </div>

        {/* Print-only preview */}
        {isPrinting && (
          <div id="chirashi-print" style={{ width: '210mm', height: '297mm' }}>
            {data.template === 'front' ? (
              <FrontPreview data={data} onImageUpload={handleImageUpload} update={update} />
            ) : (
              <BackPreview data={data} onImageUpload={handleImageUpload} update={update} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Front Preview (症状訴求型)
// ============================================================
function FrontPreview({ data, onImageUpload, update }: {
  data: ChirashiData;
  onImageUpload: (cb: (b64: string) => void) => void;
  update: <K extends keyof ChirashiData>(key: K, value: ChirashiData[K]) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col text-black relative" style={{ fontSize: 'clamp(6px, 1.2vw, 11px)' }}>
      {/* Header - Yellow bar with symptom name */}
      <div className="bg-yellow-400 px-[4%] py-[2%] relative">
        <div className="absolute top-[4%] right-[3%] bg-red-600 text-white rounded-full flex items-center justify-center" style={{ width: '12%', paddingBottom: '12%', position: 'relative' }}>
          <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ fontSize: '0.7em', lineHeight: 1.1, textAlign: 'center' }}>完全<br/>予約制</span>
        </div>
        <p className="text-red-700 font-bold" style={{ fontSize: '1.6em' }}>{data.mainSymptom}</p>
        <p className="font-black text-gray-900 leading-tight" style={{ fontSize: '2.2em' }}>{data.mainCopy}</p>
      </div>

      {/* Sub copy */}
      <div className="bg-red-600 text-white text-center py-[1.5%] font-bold" style={{ fontSize: '1.3em' }}>
        {data.subCopy}
      </div>

      {/* Body */}
      <div className="flex-1 px-[4%] py-[2%] flex flex-col gap-[1.5%]">
        {/* Worries section */}
        <div className="border-2 border-red-500 rounded-lg p-[2%]">
          <p className="text-center font-bold text-red-600 mb-[1%]" style={{ fontSize: '1.4em' }}>
            こんなお悩みありませんか？
          </p>
          <div className="space-y-[0.5%]">
            {data.worries.map((w, i) => (
              <div key={i} className="flex items-start gap-[1%]">
                <span className="text-red-500 font-bold flex-shrink-0">&#10004;</span>
                <span style={{ fontSize: '1em' }}>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price section */}
        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-[2%] text-center">
          <p className="font-bold text-red-600" style={{ fontSize: '1.1em' }}>
            {data.limitDays}限定！通常初回 <span className="line-through">{data.normalPrice}円</span> が{data.discountRate}オフ
          </p>
          <div className="flex items-baseline justify-center gap-[1%] mt-[0.5%]">
            <span className="text-gray-700 font-bold" style={{ fontSize: '1.2em' }}>特別価格</span>
            <span className="text-red-600 font-black" style={{ fontSize: '3em', lineHeight: 1 }}>{data.specialPrice}</span>
            <span className="text-red-600 font-bold" style={{ fontSize: '1.5em' }}>円</span>
            <span className="text-gray-500" style={{ fontSize: '0.9em' }}>(税込)</span>
          </div>
        </div>

        {/* Patient images */}
        <div className="grid grid-cols-4 gap-[1%] flex-1 min-h-0">
          {data.patientImages.map((img, i) => (
            <button
              key={i}
              onClick={() => onImageUpload(base64 => {
                const newImgs = [...data.patientImages];
                newImgs[i] = base64;
                update('patientImages', newImgs);
              })}
              className="bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-200 hover:border-blue-400 transition-colors"
            >
              {img ? (
                <img src={img} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300" style={{ fontSize: '0.7em' }}>写真{i + 1}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white px-[4%] py-[2%]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold" style={{ fontSize: '1.6em' }}>{data.clinicName}</p>
            <p style={{ fontSize: '0.8em' }}>{data.zipCode} {data.address}</p>
            <p style={{ fontSize: '0.8em' }}>{data.nearestStation}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: '0.7em' }} className="text-yellow-400">ご予約・お問合せ</p>
            <p className="font-black text-yellow-400" style={{ fontSize: '2em', letterSpacing: '0.05em' }}>{data.phone}</p>
            {data.lineId && <p className="text-yellow-400" style={{ fontSize: '0.7em' }}>LINE: {data.lineId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Back Preview (信頼構築型)
// ============================================================
function BackPreview({ data, onImageUpload, update }: {
  data: ChirashiData;
  onImageUpload: (cb: (b64: string) => void) => void;
  update: <K extends keyof ChirashiData>(key: K, value: ChirashiData[K]) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col text-black relative" style={{ fontSize: 'clamp(6px, 1.2vw, 11px)' }}>
      {/* Header */}
      <div className="bg-gray-900 text-white px-[4%] py-[3%] text-center">
        <p className="font-black leading-tight" style={{ fontSize: '1.8em' }}>{data.headerCopy}</p>
      </div>

      <div className="flex-1 px-[4%] py-[2%] flex flex-col gap-[2%]">
        {/* Inspection section */}
        <div className="border-l-4 border-blue-600 pl-[2%]">
          <p className="font-bold text-blue-800 mb-[0.5%]" style={{ fontSize: '1.3em' }}>独自の神経検査法</p>
          <p className="text-gray-700" style={{ fontSize: '0.9em' }}>{data.inspectionDescription}</p>
          <div className="mt-[1%] bg-blue-50 border border-blue-200 rounded p-[1.5%] italic text-gray-600" style={{ fontSize: '0.85em' }}>
            {data.doctorRecommendation}
          </div>
        </div>

        {/* Method section */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-[2.5%]">
          <p className="text-center font-black text-red-700 mb-[1%]" style={{ fontSize: '1.5em' }}>{data.methodName}</p>
          <p className="text-gray-700 text-center" style={{ fontSize: '0.9em' }}>{data.methodDescription}</p>
        </div>

        {/* Patient voices */}
        <div>
          <p className="font-bold text-center text-gray-900 mb-[1%]" style={{ fontSize: '1.3em' }}>
            喜びの声をいただいています
          </p>
          <div className="space-y-[1.5%]">
            {data.patientVoices.map((v, i) => (
              <div key={i} className="flex gap-[2%] bg-gray-50 rounded-lg p-[2%] border border-gray-200">
                <button
                  onClick={() => onImageUpload(base64 => {
                    const nv = [...data.patientVoices];
                    nv[i] = { ...nv[i], image: base64 };
                    update('patientVoices', nv);
                  })}
                  className="flex-shrink-0 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-400 transition"
                  style={{ width: '13%', aspectRatio: '1' }}
                >
                  {v.image ? (
                    <img src={v.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400" style={{ fontSize: '0.6em' }}>写真</span>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900" style={{ fontSize: '0.9em' }}>
                    {v.name}さん（{v.age}・{v.symptom}）
                  </p>
                  <p className="text-gray-600" style={{ fontSize: '0.8em' }}>{v.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price section */}
        <div className="bg-red-600 rounded-lg p-[2.5%] text-white text-center mt-auto">
          <p className="font-bold" style={{ fontSize: '1.1em' }}>本日から{data.limitDays}限定のご案内</p>
          <div className="flex items-baseline justify-center gap-[1%] mt-[0.5%]">
            <span className="line-through opacity-70" style={{ fontSize: '1em' }}>通常 {data.normalPrice}円</span>
            <span className="mx-[1%]">→</span>
            <span className="font-black text-yellow-300" style={{ fontSize: '2.8em', lineHeight: 1 }}>{data.specialPrice}</span>
            <span className="font-bold text-yellow-300" style={{ fontSize: '1.3em' }}>円</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white px-[4%] py-[2%]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold" style={{ fontSize: '1.4em' }}>{data.clinicName}</p>
            <p style={{ fontSize: '0.75em' }}>{data.zipCode} {data.address}</p>
            <p style={{ fontSize: '0.75em' }}>{data.nearestStation}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: '0.7em' }} className="text-yellow-400">ご予約・お問合せ</p>
            <p className="font-black text-yellow-400" style={{ fontSize: '1.8em', letterSpacing: '0.05em' }}>{data.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// UI Components
// ============================================================
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors";
  return (
    <div>
      <label className="text-xs text-gray-500 mb-0.5 block">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className={cls + ' resize-none'} rows={3} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
