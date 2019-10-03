'use strict';
const internals = {};
const request = require('request-promise-native');
const jimp = require('jimp');

const apiPaths = {
  token: '/Account/Token',
  photo: '/Values',
};

internals.fetchTokenFromApi = async function() {
  const options = {
    uri: `${this.config.endpoint}${apiPaths.token}`,
    method: 'POST',
    form: {
      AccountName: this.config.username,
      Password: this.config.password,
    },
  };

  try {
    const data = await request(options);
    const token = JSON.parse(data)['ServiceToken'];
    return token;
  } catch (error) {
    throw error;
  }
};

internals.fetchPhotosFromApi = async function(ids) {
  const token = await this.getToken();
  const options = {
    uri: `${this.config.endpoint}${apiPaths.photo}/${ids.join(',')}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  };

  try {
    const data = await request(options);
    const photoData = JSON.parse(data);
    const filteredPhotoData = photoData.filter(
      p => p.PictureIdentification !== null
    );
    const resizedImages = await internals.resizeImagesToWidth.call(
      this,
      filteredPhotoData
    );
    await this.cache.setPhotos(resizedImages);
    return resizedImages;
  } catch (error) {
    throw error;
  }
};

internals.resizeImage = async function(data, width) {
  width = parseInt(width);
  // read image
  const image = await jimp.read(Buffer.from(data, 'base64'));
  if (image.bitmap.width > width) {
    await image.resize(width, jimp.AUTO);
  }
  const buffer = await image.getBufferAsync(jimp.MIME_JPEG);
  return buffer.toString('base64');
};

internals.resizeImagesToWidth = async function(data, width) {
  const maxWidth = parseInt(this.config.maxWidth);
  if (!maxWidth) {
    return data;
  }

  const promises = data
    .map(item => {
      if (!item.PictureIdentification) return null;
      const buffer = Buffer.from(item.PictureIdentification, 'base64');
      return internals.resizeImage(buffer, maxWidth);
    })
    .filter(Boolean);

  const resizeResults = await Promise.all(promises);
  return resizeResults.map((p, i) => {
    return {
      ...data[i],
      PictureIdentification: p.toString('base64'),
    };
  });
};

module.exports = internals;
