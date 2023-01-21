//Trabalhar com tempo trabalhado
export function cal_time_value(valorP, horasT,horasD){ //TESTE
  let media = ((valorp/(horasT/24))/horasD)
}

export function build_time(obj, pos) {
  try {
    if (obj !== null) {
      if (pos !== null) {
        let aux = {
          hour: 0,
          min: 0,
          seg: 0,
        };
        //Soma todos os tempos
        for (i = 0; i < obj[pos].tarefas.length; i++) {
          let tarefa = obj[pos].tarefas[i];
          aux.hour += parseFloat(tarefa.cronometro.hours);
          aux.min += parseFloat(tarefa.cronometro.minutes);
          aux.seg += parseFloat(tarefa.cronometro.seconds);
        }
        //Objeto de retorno
        let time = {
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
        //Cascata de reconstrução
        time.seconds = time_expected(aux.seg, 0);
        time.minutes = time_expected(aux.min, time.seconds.decorrido);
        time.hours = time_expected(aux.hour, time.minutes.decorrido);
        return time;
      }
    }
  } catch (e) {
    console.log(e);
    return 0;
  }
}



//Reconstruir tempo, seja estimado ou trabalhado
function time_expected(time, soma) {
  let timer = {
    decorrido: 0,
    sobrando: 0,
  };
  time += soma; //Soma o tempo sobrando...
  time.decorrido = Math.floor(time / 60);
  time.sobrando = (time / 60 - time.decorrido) * 60;
}