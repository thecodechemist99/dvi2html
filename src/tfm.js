var fs = require('fs');
var exec = require('child_process').execSync;

// should reference
// https://github.com/FabriceSalvaire/PyDVI/blob/master/PyDvi/Font/TfmParser.py

var font_dir = '/usr/share/texmf-dist/fonts/tfm/public/cm/';

var metadata = [
  {
    name: 'File length'
  },
  {
    name: 'Header',
    fields: [
      {
        name: 'Checksum',
        type: 'ascii',
        length: 4
      },
      {
        name: 'Design Size',
        type: 'ascii',
        length: 4
      },
      {
        name: 'Coding Scheme',
        type: 'ascii',
        length: 40
      },
      {
        name: 'Family',
        type: 'ascii',
        length: 20
      },
      {
        name: 'Face',
        // if face_value is < 18
        // it has the following interpretation as a ``weight, slope, and expansion'':
        // Add 0 or 2 or 4 (for medium or bold or light) to 0 or 1 (for roman
        // or italic) to 0 or 6 or 12 (for regular or condensed or extended).
        fields: [
          {
            name: '7_bit_save_flag',
            length: 1
          },
          null,
          null,
          {
            name: 'face_value',
            length: 1
          }
        ]
      },
      {
        name: 'Comment',
        type: 'ascii',
        length: 4
      }
    ]
  },
  {
    name: 'First char code'
  },
  {
    name: 'Last char code'
  },
  {
    name: 'Width table length'
  },
  {
    name: 'Height table length'
  },
  {
    name: 'Depth table length'
  },
  {
    name: 'Italic table length'
  },
  {
    name: 'Lig/kern table length'
  },
  {
    name: 'Kern table length'
  },
  {
    name: 'Ext char table length'
  },
  {
    name: 'Font parameters'
  }
];

var buffer, len;

/**
 * Process the first 24-bytes of the file:
 */
function processFileInfo() {
  var i = 0, field;

  while(i < 24) {
    field = metadata[i/2];
    field.length = buffer.readUInt16BE(i); i += 2;
  }
}

function readBytesFrom(i) {

}

function processSection(metadataIndex, bufferOffset) {
  console.log('PROCESSING ' + metadata[metadataIndex].name);

  var section = metadata[metadataIndex];
  var content = buffer.slice(bufferOffset, section.length);
  
  return (metadata[metadataIndex] = processField(section, content));
}

function processField(field, content) {
  if(field === null) return;

  var f, i = 0, offset = 0;
  
  if(field.fields) {
    while(i < field.fields.length) {
      f = field.fields[i] = processField(field.fields[i++], content.slice(offset));
      if(f) offset += f.length;
    }
  }
  else {
    switch(field.type) {
      case 'ascii':
        field.value = content.slice(offset, field.length).toString(field.type);
      break;
      default:
        if(field.length === 1) {
          field.value = content.readUInt8(offset, 1);
        }
        else {
          field.value = content.readUInt16BE(offset, field.length);  
        }
    }
  }

  return field;
}

function readFixWords(buffer, index, count) {
  var table = [];
  var k;
  for( var k = 0; k<count; k++ ) {
    table[k] = buffer.slice(index, index+4).readUInt32BE(0);
    index = index + 4;
  }
  return table;
}

function processMetrics() {
  //j += processSection(1, j);

  /*
  while(i < metadata.length && j < buffer.length) {

  }
  */
  
  var parameters = [];

  metadata.forEach(function(nameValue) {
    parameters[nameValue.name] = nameValue.length;
  });

  var headerLength = parameters['Header'];
  var j = 4*(headerLength + 1);

  var header = processField( metadata[1], buffer.slice( 24, j ) );
  console.log( JSON.stringify(header) );
                             
  
  var firstCharCode = parameters['First char code'];
  var lastCharCode = parameters['Last char code'];
  var widthTableLength = parameters['Width table length'];
  var heightTableLength = parameters['Height table length'];
  var depthTableLength = parameters['Depth table length'];
  var italicTableLength = parameters['Italic table length'];
  var ligkernTableLength = parameters['Lig/kern table length'];
  var kernTableLength = parameters['Kern table length'];
  var extenTableLength = parameters['Ext char table length'];
  var paramTableLength = parameters['Font parameters'];

  var charInfo = [];
  var charCode;
  for( charCode=firstCharCode; charCode<lastCharCode; charCode++ ) {
    charInfo[charCode] = buffer.slice(j, j+4).readUInt32BE(0);
    j = j + 4;
  }
  //console.log("charinfo=",charInfo);

  var widthTable = readFixWords( buffer, j, widthTableLength);
  j = j + 4*widthTableLength;

  var heightTable = readFixWords( buffer, j, heightTableLength);
  j = j + 4*heightTableLength;

  var depthTable = readFixWords( buffer, j, depthTableLength);
  j = j + 4*depthTableLength;

  var italicTable = readFixWords( buffer, j, italicTableLength);
  j = j + 4*italicTableLength;

  var ligkernTable = readFixWords( buffer, j, ligkernTableLength);
  j = j + 4*ligkernTableLength;

  var kernTable = readFixWords( buffer, j, kernTableLength);
  j = j + 4*kernTableLength;

  var extenTable = readFixWords( buffer, j, extenTableLength);
  j = j + 4*extenTableLength;

  var paramTable = readFixWords( buffer, j, paramTableLength);
  j = j + 4*paramTableLength;            

  console.log(j);

  
  
  //there then follow the four tables width, height, depth and italic, which contain values (in fix_word format) referred to by indexes in char_info.
    
  // after header, char_code tables
  // 32-bit (1 for each character, end_char_code - start_char_code)
  // width_index: 8bits
  // height_index: 4bits
  // depth_index: 4bits
  // italic_index: 6bits
  // tag_index: 2bits
  //    - 0 = unused
  //    - 1 = has ligature/kerning at lig_kern[remainder]
  //    - 2 = has extensions (is an extendable character) exten[remainder]
  // remainder: 8bits

  // while(i < contents.length) {

  //   if(i === 0) {
  //     while(j < 24) {
  //       field = infoFields[j/2];
  //       info[field] = contents.slice(j, j+2).readUInt16BE(0);
  //       j += 2;
  //     }

  //     //  adding header bytes for now
  //     i += info[infoFields[0]];
  //   }

    //  FInfo Entry (one for each character)
    //  -------------------
    //  The flelds in the FInfoEntry do not give the character width, height,
    //  etc. directly, they are indices into secondary tables
    //  
    //  width_index   = 8 bits
    //  height_index  = 4 bits
    //  depth_index   = 4 bits
    //  charIc_index  = 6 bits
    //  tag_field     = 2 bits
    //  remainder     = 8 bits
  //   chars.push({
  //     wi: contents.slice(i, ++i).readInt8(0),
  //     hi: parseInt(parseInt(contents.slice(i, i+1).readUInt8(0), 10).toString(2).slice(0,4), 2),
  //     di: parseInt(parseInt(contents.slice(i, ++i).readUInt8(0), 10).toString(2).slice(4,8), 2),
  //     ci: parseInt(parseInt(contents.slice(i, i+1).readUInt8(0), 10).toString(2).slice(0,6), 2),
  //     tf: parseInt(parseInt(contents.slice(i, ++i).readUInt8(0), 10).toString(2).slice(6,8), 2),
  //     r: contents.slice(i, ++i).readInt8(0)
  //   });
  // }

  console.log(metadata[1]);
}

function getMetricsFile(name) {
  var path = [font_dir, name].join('/') + '.tfm';
  //path = path.replace(/^[\s\n\t]+|[\s\n\t]+$/, '')
  console.log("PATH=",path);
  buffer = fs.readFileSync(path);
}

getMetricsFile('cmr10');
processFileInfo();
console.log("buffer.length=",buffer.length);
processMetrics();

module.exports = {
  getMetrics: getMetricsFile
};
