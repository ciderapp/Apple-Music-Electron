class BufferGetter extends AudioWorkletProcessor {
  constructor () {
    super();

  }

  process (inputs) {
      const input = inputs[0];
      for (let channel = 0; channel < input.length; channel++) {
          const inputChannel = input[channel];
          console.log(typeof(inputChannel));
      }
  }    
}



registerProcessor('buffer-getter', BufferGetter);