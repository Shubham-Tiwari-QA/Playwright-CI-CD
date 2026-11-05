async function captureStep(page, testInfo, name) {
  await testInfo.attach(name, {
    body: await page.screenshot({
      fullPage: true,
    }),
    contentType: 'image/png',
  });

  console.log(`Screenshot captured: ${name}.`);
}

module.exports = {
  captureStep,
};
