/*
Copyright (c) <2013>, <Zizon Qiu zzdtsv@gmail.com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.
3. All advertising materials mentioning features or use of this software
   must display the following acknowledgement:
   This product includes software developed by the <organization>.
4. Neither the name of the <organization> nor the
   names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ''AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function makeHMAC(hash){
	"use strict";

	if(hash === undefined){
		hash = function (_bytes){
			// padding
			var length = _bytes.length;
			var to_pad = 64 - length % 64;

			switch(to_pad){
				case 0:to_pad = 64;break;
				case 1:case 2:case 3:case 4:
				case 5:case 6:case 7:case 8:
				       to_pad += 64;break;
			}	
			

			var new_length = length + to_pad;
			var bytes = new Array(new_length);
			bytes[length] = 0x80;

			var bits = length << 3;
			bytes[new_length-4] = bits>>>24;
			bytes[new_length-3] = (bits>>>16) & 0xff;
			bytes[new_length-2] = (bits>>>8) & 0xff;
			bytes[new_length-1] = bits & 0xff;
		
			_bytes.forEach(function(e,i,a){bytes[i] = e});

			for( var i=length+1,end=new_length-4; i<end; i++ ){
				bytes[i] = 0x0;
			}

			var vector = [0x67452301,0xefcdab89,0x98badcfe,0x10325476,0xc3d2e1f0];
			var w = new Array(80);
			var chunk,a,b,c,d,e,f,k,temp;
			for( var block=0; block<bytes.length; block+=64 ){
				chunk = bytes.slice(block,block+64);
				for( var i=0; i<16; i++ ){
					var offest = i*4;
					w[i] = ((chunk[offest] << 24) & 0xff000000) 
						| ((chunk[offest+1] << 16)& 0x00ff0000)
						| ((chunk[offest+2] << 8)& 0x0000ff00)
						| ((chunk[offest+3] )& 0x000000ff);
				}

				for( var i=16; i<80; i++ ){
					w[i] = w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16];
					w[i] = (w[i] << 1) | (w[i] >>> 31);
				}

				a = vector[0];
				b = vector[1];
				c = vector[2];
				d = vector[3];
				e = vector[4];

				for( var i=0; i<80; i++ ){
					if( i<=19 ){
						f = d ^ (b & (c ^ d) );
						k = 0x5A827999;
					}else if( i<=39 ){
						f = b ^ c ^ d;
						k = 0x6ED9EBA1;
					}else if( i<= 59){
						f = (b & c) | (d & (b | c));
						k = 0x8F1BBCDC;
					}else {
						f = b ^ c ^ d;
						k = 0xCA62C1D6;
					}

					temp =( (a<<5)  | (a >>> 27) ) + f + e + k + w[i];
					e = d;
					d = c;
					c = (b<<30) | (b>>>2);
					b = a;
					a = temp;
				}

				vector[0] = vector[0] + a;
				vector[1] = vector[1] + b;
				vector[2] = vector[2] + c;
				vector[3] = vector[3] + d;
				vector[4] = vector[4] + e;
			}

			var raw = new Array(20);
			for( var base=0,i=0; i<5; i++ ){
				raw[base++] = vector[i] >>> 24;
				raw[base++] = (vector[i] >>> 16) & 0xff;
				raw[base++] = (vector[i] >>> 8) & 0xff;
				raw[base++] = vector[i] & 0xff;
			}	
			return raw;
		}
	}

	return function(_key,_text){
		var ipad = new Array(64+_text.length);
		var opad = new Array(64);

		var bytes = new Array(_key.length);
		for( var i=0; i<_key.length; i++ ){
			bytes[i] = _key.charCodeAt(i) & 0xff;
		}

		// truncate	
		if( bytes.length > 64 ){
			bytes = hash(bytes);
		}

		var i=0;
		for( ; i<bytes.length; i++){
			ipad[i] = bytes[i] ^ 0x36;
			opad[i] = bytes[i] ^ 0x5c;
		}		
		for( ; i<64; i++){
			ipad[i] = 0x36;
			opad[i] = 0x5c;
		}

		for(var j=0 ; j<_text.length; j++,i++){
			ipad[i] = _text.charCodeAt(j) & 0xff;
		}

		return hash(opad.concat(hash(ipad))).map(function(cell){
				var c = cell.toString(16);
				switch(c.length){
				case 0:return '00';
				case 1:return '0'+c;
				case 2:return c;
				default:return result.substr(c.length-2);
				}
		}).join('');
	}
}
