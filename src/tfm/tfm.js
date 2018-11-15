// PyDvi - A Python Library to Process DVI Stream
// Copyright (C) 2014 Fabrice Salvaire
//;
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
/////////////////////////////////////////////////////////////////////////////

/*  This module handles TeX Font Metric.

The class :class:`PyDvi.Tfm` handles the font's metric.  To get a :class:`PyDvi.Tfm` instance for a
particular font use the static method :meth:`PyDvi.TfmParser.TfmParser.parse`.  For example use this
code for the font "cmr10"::

  tfm = TfmParser.parse('cmr10', '/usr/share/texmf/fonts/tfm/public/cm/cmr10.tfm')

The number of characters in the font can be obtained using the function :func:`len`::

  >>> len(tfm)
  128

Each character's metric is stored in a :class:`TfmChar` instance that can be accessed using the char
code as index on the :class:`Tfm` class instance.  For example to get the metric of the character
"A" use::

   tfm[ord('A')]

 */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////;

class TfmChar {
  constructor(
    tfm,
    char_code,
    width,
    height,
    depth,
    italic_correction,
    lig_kern_program_index,
    next_larger_char) {

    this.tfm = tfm;
    tfm.set_char(char_code, this);

    this.char_code = char_code;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.italic_correction = italic_correction;

    this.lig_kern_program_index = lig_kern_program_index;
    this.next_larger_char = next_larger_char;
  }
  
  scaled_width(scale_factor) {
    /*  Return the scaled width by *scale_factor*.  */
    return this.width * scale_factor;
  }

  scaled_height(scale_factor) {
    /*  Return the scaled height by *scale_factor*.  */
    return (this.height * scale_factor);
  }

  scaled_depth(scale_factor) {
    /*  Return the scaled depth by *scale_factor*.  */
    return Number(this.depth * scale_factor);
  }

  scaled_dimensions(scale_factor) {
    /*  Return the 3-tuple made of the scaled width, height and depth by *scale_factor*.  */
    return [this.width, this.height, this.depth].map( function(x) { return x * scale_factor; } );
  }

  next_larger_tfm_char() {
    /*  Return the :class:`TfmChar` instance for the next larger char if it exists else return
        :obj:`None`. */;

    if (this.next_larger_char !== null) {
      return this.tfm.get_char(this.next_larger_char);
    } else {
      return null;
    }
  }    

  get_lig_kern_program(self) {
    /*  Get the ligature/kern program of the character.  */;

    if (this.lig_kern_program_index !== null) {
      return this.tfm.get_lig_kern_program(this.lig_kern_program_index);
    } else {
      return null;
    }
  }
}

/*  This class encapsulates a TeX Font Metric for an extensible Glyph. */
class TfmExtensibleChar extends TfmChar {
  constructor(
    tfm,
    char_code,
    width,
    height,
    depth,
    italic_correction,
    extensible_recipe,
    lig_kern_program_index,
    next_larger_char) {
    
    super(tfm,
          char_code,
          width,
          height,
          depth,
          italic_correction,
          lig_kern_program_index,
          next_larger_char);
    
    // BADBAD
    this.top, this.mid, this.bot, this.rep = extensible_recipe;
  }
}

class TfmLigKern {
  constructor(tfm, index, stop, next_char) {
    this.tfm = tfm;
    this.stop = stop;
    this.index = index;
    this.next_char = next_char;
    this.tfm.add_lig_kern(this);
  }
}


/*  This class represents a Kerning Program Instruction. */
class TfmKern extends TfmLigKern {
    constructor(tfm, index, stop, next_char, kern) {
      super(tfm, index, stop, next_char);
      this.kern = kern;
    }
}

/*  This class represents a Ligature Program Instruction. */
class TfmLigature extends TfmLigKern {
    constructor(tfm,
                 index,
                 stop,
                 next_char,
                 ligature_char_code,
                 number_of_chars_to_pass_over,
                 current_char_is_deleted,
                 next_char_is_deleted) {

      super(tfm, index, stop, next_char);
      this.ligature_char_code = ligature_char_code;
      this.number_of_chars_to_pass_over = number_of_chars_to_pass_over;
      this.current_char_is_deleted = current_char_is_deleted;
      this.next_char_is_deleted = next_char_is_deleted;
    }
}

/*  This class encapsulates a TeX Font Metric for a font. */
class Tfm {
  constructor(   font_name,
                 filename,
                 smallest_character_code,
                 largest_character_code,
                 checksum,
                 design_font_size,
                 character_coding_scheme,
                 family) {

    this.font_name = font_name;
    this.filename = filename;
    this.smallest_character_code = smallest_character_code;
    this.largest_character_code = largest_character_code;
    this.checksum = checksum;
    this.design_font_size = design_font_size;
    this.character_coding_scheme = character_coding_scheme;
    this.family = family;

    this._lig_kerns = [];
    this._chars = {};
  }

  get_char(x) {
    return this._chars[x];
  }

  set_char(x,y) {
    this._chars[x] = y;
  }
  
 set_font_parameters(parameters) {
        /*  Set the font parameters.  */;
      this.slant = parameters[0];
      this.spacing = parameters[1];
      this.space_stretch = parameters[2];
      this.space_shrink = parameters[3];
      this.x_height = parameters[4];
      this.quad = parameters[5];
      this.extra_space = parameters[6];
    }
  
 set_math_symbols_parameters(parameters) {
      /*  Set the math symbols parameters.  */;
      this.num1 = parameters[0];
      this.num2 = parameters[1];
      this.num3 = parameters[2];
      this.denom1 = parameters[3];
      this.denom2 = parameters[4];
      this.sup1 = parameters[5];
      this.sup2 = parameters[6];
      this.sup3 = parameters[7];
      this.sub1 = parameters[8];
      this.sub2 = parameters[9];
      this.supdrop = parameters[10];
      this.subdrop = parameters[11];
      this.delim1 = parameters[12];
      this.delim2 = parameters[13];
      this.axis_height = parameters[14];
    }

  set_math_extension_parameters(parameters) {
    this.default_rule_thickness = parameters[0];
    this.big_op_spacing = parameters.slice(1);
  }

  add_lig_kern(obj) {
    /*  Add a ligature/kern program *obj*.  */;
    this._lig_kerns.push(obj);
  }

  get_lig_kern_program(i) {
    /*  Return the ligature/kern program at index *i*.  */;
    return this._lig_kerns[i];
  }
}

module.exports.TfmKern = TfmKern;
module.exports.TfmLigature = TfmLigature;
module.exports.TfmExtensibleChar = TfmExtensibleChar;
module.exports.TfmChar = TfmChar;
module.exports.Tfm = Tfm;
