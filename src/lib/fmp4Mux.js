// Minimal fragmented-MP4 (fMP4) muxer for MSE / MediaSource.
// Pure ES module, no dependencies — runs in browser and Node.
//
// Input: one audio + one video encoded stream (H.264 AVCC / raw AAC frames).
// Output: init segment (ftyp+moov) and media fragments (moof+mdat).
//
// Packet fields accepted: { dts, pts, duration, isKey, data } all in seconds.

const ENC = new TextEncoder();

function box(type, ...children) {
  let size = 8;
  for (const c of children) size += c.byteLength;
  const out = new Uint8Array(size);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, size);
  out.set(ENC.encode(type), 4);
  let off = 8;
  for (const c of children) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

function concat(parts) {
  let len = 0;
  for (const p of parts) len += p.byteLength;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.byteLength; }
  return out;
}

function u8(...bytes) { return new Uint8Array(bytes); }
function u16be(v) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, v);
  return b;
}
function u32be(v) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, v >>> 0);
  return b;
}
function u64be(v) {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, BigInt(Math.round(v)));
  return b;
}
function full(value, version) {
  return new Uint8Array([version || 0, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]);
}

// ---------- init segment boxes ----------

function ftypBox() {
  return box('ftyp', concat([ENC.encode('isom'), u32be(0), ENC.encode('isom'), ENC.encode('iso2'), ENC.encode('avc1'), ENC.encode('mp41')]));
}

function mvhdBox(timescale, trackCount) {
  const body = new Uint8Array(100);        // version 0 profile
  const dv = new DataView(body.buffer);
  // version/flags
  dv.setUint32(4, 0);                       // creation time
  dv.setUint32(8, 0);                       // modification
  dv.setUint32(12, timescale);              // timescale 1000
  dv.setUint32(16, 0);                      // duration 0
  dv.setUint32(20, 0x00010000);             // rate 1.0
  dv.setUint16(24, 0x0100);                 // volume 1.0
  // 26..35 reserved
  dv.setUint32(64, 0x00010000);             // matrix[0]
  dv.setUint32(68, 0x00010000);             // matrix[4]
  dv.setUint32(72, 0x40000000);             // matrix[8]
  // 76..95 pre_defined
  dv.setUint32(96, trackCount + 1);         // next track id
  return box('mvhd', body);
}

function tkhdBox(id, kind, w, h) {
  const body = new Uint8Array(84);         // version 0 profile
  const dv = new DataView(body.buffer);
  body.set([0, 0, 0, 7], 0);                // enabled+in_movie+in_preview
  dv.setUint32(4, 0);                       // creation
  dv.setUint32(8, 0);                       // modification
  dv.setUint32(12, id);                     // track id
  dv.setUint32(20, 0);                      // duration 0
  // layer(2)/alternate_group(2) at 32
  if (kind === 'audio') dv.setUint16(36, 0x0100); // volume 1.0
  dv.setUint32(40, 0x00010000);             // matrix[0]
  dv.setUint32(44, 0x00010000);             // matrix[4]
  dv.setUint32(48, 0x40000000);             // matrix[8]
  if (kind === 'video') {
    dv.setUint32(76, w << 16);              // width 16.16
    dv.setUint32(80, h << 16);              // height 16.16
  }
  return box('tkhd', body);
}

function mdhdBox(timescale) {
  const body = new Uint8Array(24);         // version 0 profile
  const dv = new DataView(body.buffer);
  dv.setUint32(4, 0);                       // creation
  dv.setUint32(8, 0);                       // modification
  dv.setUint32(12, timescale);
  dv.setUint32(16, 0);                      // duration
  dv.setUint16(20, 0x55c4);                 // language undefined
  return box('mdhd', body);
}

function hdlrBox(kind) {
  const name = ENC.encode(kind === 'video' ? 'VideoHandler' : 'SoundHandler');
  const body = new Uint8Array(24 + name.byteLength + 1);
  body.set(ENC.encode(kind === 'video' ? 'vide' : 'soun'), 8);
  body.set(name, 24);
  return box('hdlr', body);
}

function drefBox() {
  const url = box('url ', u8(0, 0, 0, 1));
  return box('dref', full(0, 0), u32be(1), url);
}

function vmhdBox() {
  return box('vmhd', full(1, 0), new Uint8Array(8));
}
function smhdBox() {
  return box('smhd', full(0, 0), new Uint8Array(4));
}

function avcCBox(avcCBody) {
  return box('avcC', avcCBody);
}

function avc1Entry(v) {
  const avcC = avcCBox(v.avcCBody);
  const body = new Uint8Array(78 + avcC.byteLength);
  const dv = new DataView(body.buffer);
  dv.setUint16(6, 1);                      // data_reference_index
  dv.setUint16(24, v.width);
  dv.setUint16(26, v.height);
  dv.setUint32(28, 0x00480000);            // horiz resolution
  dv.setUint32(32, 0x00480000);            // vert resolution
  dv.setUint32(40, 1);                     // frame_count
  // 42..74 compressorname (zero = default)
  dv.setUint16(74, 0x0018);                // depth
  dv.setInt16(76, -1);                     // pre_defined
  body.set(avcC, 78);
  return box('avc1', body);
}

function esdsBox(asc) {
  const dsi = concat([u8(0x05), u8(asc.byteLength), asc]);
  const dcdPayload = 13 + dsi.byteLength;   // OTI+streamType+bufferSize+maxBR+avgBR+dsi
  const dcdFull = 2 + dcdPayload;            // tag + length + content
  const esId = concat([u16be(1)]);            // ES_ID = 1
  const esFlags = u8(0x00);
  const esPayload = esId.byteLength + esFlags.byteLength + dcdFull;
  const es = concat([u8(0x03), u8(esPayload), esId, esFlags,
    concat([u8(0x04), u8(dcdPayload),
      u8(0x40),                                // objectTypeIndication MPEG-4 Audio
      u8(0x15),                                // streamType=5 audio, reserved=1
      new Uint8Array(3),                        // bufferSizeDB
      new Uint8Array(4),                        // maxBitrate
      new Uint8Array(4),                        // avgBitrate
      dsi])]);
  return box('esds', full(0, 0), es);
}

function mp4aEntry(a) {
  const esds = esdsBox(a.asc);
  const body = new Uint8Array(28 + esds.byteLength);
  const dv = new DataView(body.buffer);
  dv.setUint16(6, 1);                      // data_reference_index
  dv.setUint16(16, a.channels);
  dv.setUint16(18, 16);                    // sample size
  dv.setUint32(24, a.sampleRate << 16);    // sample rate 16.16
  body.set(esds, 28);
  return box('mp4a', body);
}

function stsdBox(track) {
  const entry = track.kind === 'video' ? avc1Entry(track) : mp4aEntry(track);
  return box('stsd', full(0, 0), u32be(1), entry);
}

function sttsBox() { return box('stts', full(0, 0), u32be(0)); }
function stscBox() { return box('stsc', full(0, 0), u32be(0)); }
function stszBox() { return box('stsz', full(0, 0), u32be(0), u32be(0)); }
function stcoBox() { return box('stco', full(0, 0), u32be(0)); }

function trexBox(id) {
  const body = new Uint8Array(20);
  const dv = new DataView(body.buffer);
  dv.setUint32(0, id);
  dv.setUint32(4, 1);                      // default_sample_description_index
  dv.setUint32(16, 0x01010000);            // default_sample_flags (non-sync)
  return box('trex', full(0, 0), body);
}

function moovBox(tracks) {
  const mvhd = mvhdBox(1000, tracks.length);
  const traks = tracks.map((t) => {
    const tkhd = tkhdBox(t.id, t.kind, t.width, t.height);
    const mdhd = mdhdBox(t.timescale);
    const hdlr = hdlrBox(t.kind);
    const stbl = box('stbl', stsdBox(t), sttsBox(), stscBox(), stszBox(), stcoBox());
    const minf = box('minf', t.kind === 'video' ? vmhdBox() : smhdBox(), drefBox(), stbl);
    const mdia = box('mdia', mdhd, hdlr, minf);
    return box('trak', tkhd, mdia);
  });
  const mvex = box('mvex', ...tracks.map((t) => trexBox(t.id)));
  return box('moov', mvhd, ...traks, mvex);
}

// ---------- fragment boxes ----------

function mfhdBox(seq) { return box('mfhd', full(0, 0), u32be(seq)); }

function tfhdBox(id) {
  // flags: default-base-is-moof (0x020000) | sample-description-index (0x000002)
  return box('tfhd', full(0x020002, 0), u32be(id), u32be(1));
}

function tfdtBox(dts, timescale) {
  return box('tfdt', full(0, 1), u64be(dts * timescale));
}

function trunBox(samples, timescale, dataOffset) {
  const body = new Uint8Array(4 + samples.length * 20); // sample_count + entries
  const dv = new DataView(body.buffer);
  dv.setUint32(0, samples.length);
  dv.setInt32(4, dataOffset);
  let o = 8;
  for (const s of samples) {
    dv.setUint32(o, Math.round(s.duration * timescale)); o += 4;
    dv.setUint32(o, s.data.byteLength); o += 4;
    dv.setUint32(o, s.isKey ? 0x02000000 : 0x01010000); o += 4;
    dv.setInt32(o, Math.round((s.pts - s.dts) * timescale)); o += 4;
  }
  return box('trun', full(0x000F01, 1), body);
}

// ---------- muxer ----------

export class Fmp4Muxer {
  constructor(trackConfigs, callbacks) {
    // trackConfigs: [{ id, kind, timescale, width, height, avcCBody, asc, channels, sampleRate }]
    // callbacks: { onInit(Uint8Array), onFragment(Uint8Array) }
    this.tracks = trackConfigs.map((t) => ({ ...t, samples: [] }));
    this.callbacks = callbacks;
    this.seq = 1;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.callbacks.onInit(concat([ftypBox(), moovBox(this.tracks)]));
    this.initialized = true;
  }

  addPacket(trackId, pkt) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track) throw new Error('unknown track ' + trackId);
    track.samples.push({
      dts: pkt.dts,
      pts: pkt.pts,
      duration: pkt.duration,
      isKey: !!pkt.isKey,
      data: pkt.data,
    });
  }

  flush() {
    this.init();
    const active = this.tracks.filter((t) => t.samples.length);
    if (!active.length) return null;

    // video traf first, then audio
    active.sort((a, b) => (a.kind === 'video' ? -1 : 1) - (b.kind === 'audio' ? -1 : 1) || a.id - b.id);

    // compute per-track payload offsets inside mdat
    const trackDataOffsets = new Map();
    let mdatPayloadLen = 0;
    for (const t of active) {
      trackDataOffsets.set(t.id, mdatPayloadLen);
      mdatPayloadLen += t.samples.reduce((s, sm) => s + sm.data.byteLength, 0);
    }
    const mdatPayload = concat(active.flatMap((t) => t.samples.map((s) => s.data)));

    // initial trafs to derive stable moof size (moof hdr 8 + mfhd 16 + trafs)
    let moofSize = 8 + 16;
    const temps = active.map((t) => {
      const trun = trunBox(t.samples, t.timescale, 0);
      const traf = box('traf', tfhdBox(t.id), tfdtBox(t.samples[0].dts, t.timescale), trun);
      moofSize += traf.byteLength;
      return traf;
    });

    // rebuild with correct data offsets
    const dataOffsetBase = moofSize + 8;
    const trafs = active.map((t) => {
      const trun = trunBox(t.samples, t.timescale, dataOffsetBase + trackDataOffsets.get(t.id));
      return box('traf', tfhdBox(t.id), tfdtBox(t.samples[0].dts, t.timescale), trun);
    });

    const moof = box('moof', mfhdBox(this.seq++), ...trafs);
    const mdat = box('mdat', mdatPayload);
    const fragment = concat([moof, mdat]);

    for (const t of active) t.samples = [];
    this.callbacks.onFragment(fragment);
    return fragment;
  }
}