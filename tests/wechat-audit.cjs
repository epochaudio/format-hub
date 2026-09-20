const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const tmp = fs.mkdtempSync(os.tmpdir() + '/fh-wechat-audit-');
app.setPath('userData', tmp);
const output = process.argv[4];
fs.mkdirSync(output, { recursive: true });
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 677, height: 800, webPreferences: { sandbox: true, contextIsolation: true } });
  try {
    await window.loadURL(process.argv[2]);
    const samples = await window.webContents.executeJavaScript(`(async () => {
      const {renderMarkdown} = await import('/src/core/markdown.js');
      const {themes, themeGroups, buildHtmlDocument} = await import('/src/themes/index.js');
      const {buildWechatPayload,buildWechatDocument} = await import('/src/core/wechat.js');
      while (!document.querySelector('textarea')) await new Promise(r=>setTimeout(r,20));
      const input = '&#x20;格莱美把它归入"爵士融合"。这个标签当然没有错，但也几乎没有任何信息量。《First Circle》真正做到的事情，用一句话概括就是：**用极高的作曲复杂度，制造一种毫不复杂的情绪体验。**';
      const fixtures = { paragraph: input, example: document.querySelector('textarea').value };
      const output=[];
      for (const [fixture, text] of Object.entries(fixtures)) {
        const html = await renderMarkdown(text, {includeTOC: true});
        for (const theme of Object.values(themeGroups).flatMap(g=>g.themes)) {
          const host=document.createElement('div');
          host.innerHTML='<style>'+themes[theme].css('github',false)+'</style><div class="wx-content" style="width:640px">'+html+'</div>';
          document.body.append(host);
          await document.fonts.ready;
          const payload = await buildWechatPayload(host.querySelector('.wx-content'));
          output.push({name:fixture+'-'+theme, html:payload.html});
          if(fixture==='example' && theme==='default-reading') output.push({name:'html-export-default',html:buildWechatDocument(payload)});
          host.remove();
        }
      }
      return output;
    })()`);
    await window.loadURL('about:blank');
    const bundle=fs.readFileSync(process.argv[3],'utf8');
    await window.webContents.executeJavaScript(bundle + '; window.verifyArticleStructure=VerifyArticleStructure.default || VerifyArticleStructure.verifyArticleStructure; void 0;');
    const results=[];
    for (const sample of samples) {
      fs.writeFileSync(output+'/'+sample.name+'.html',sample.html);
      const result=await window.webContents.executeJavaScript(`(async()=>{const container=document.createElement('div');container.innerHTML=${JSON.stringify(sample.html)};return JSON.parse(JSON.stringify(await window.verifyArticleStructure(container)));})()`);
      results.push({name:sample.name,result});
      fs.writeFileSync(output+'/results.json',JSON.stringify(results,null,2));
      console.log(sample.name, result.isValid ? 'PASS' : JSON.stringify(Object.fromEntries(Object.entries(result.inValidInfo).map(([key, value]) => [key, value.items.length]))));
    }
    window.destroy();
    fs.rmSync(tmp, {recursive:true,force:true});
    app.exit(results.every(item => item.result.isValid) ? 0 : 1);
  } catch(e) {console.error(e);window.destroy();fs.rmSync(tmp,{recursive:true,force:true});app.exit(2);}
});
setTimeout(()=>{console.error('Audit timeout');app.exit(2)},180000);
