import { SeismicParams } from './SeismicParameterForm';

type SeismicInfoProps = {
  params: SeismicParams;
  elapsedTime: number;
};

export default function SeismicInfo({ params, elapsedTime }: SeismicInfoProps) {
  const { magnitude, depth, waveVelocity, epicenterX, epicenterY } = params;
  
  // Calculate some additional info based on magnitude
  const potentialDamage = getMagnitudeDamage(magnitude);
  const estimatedRadius = Math.round(magnitude * 2);
  const richterScale = getRichterDescription(magnitude);
  
  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-xl font-bold border-b pb-2">Earthquake Information</h2>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="font-medium">Magnitude:</div>
        <div className="text-right">{magnitude.toFixed(1)}</div>
        
        <div className="font-medium">Depth:</div>
        <div className="text-right">{depth} km</div>
        
        <div className="font-medium">Epicenter:</div>
        <div className="text-right">X: {epicenterX}, Y: {epicenterY}</div>
        
        <div className="font-medium">Wave Velocity:</div>
        <div className="text-right">{waveVelocity} km/s</div>
        
        <div className="font-medium">Estimated Affected Radius:</div>
        <div className="text-right">{estimatedRadius} km</div>
        
        <div className="font-medium">Elapsed Time:</div>
        <div className="text-right">{elapsedTime.toFixed(1)} s</div>
      </div>
      
      <div className="mt-4 pt-3 border-t">
        <div className="font-medium mb-1">Richter Scale:</div>
        <div className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{richterScale}</div>
      </div>
      
      <div className="mt-3">
        <div className="font-medium mb-1">Potential Damage:</div>
        <div className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{potentialDamage}</div>
      </div>
    </div>
  );
}

function getMagnitudeDamage(magnitude: number): string {
  if (magnitude < 2.0) {
    return "Micro earthquake. Not felt.";
  } else if (magnitude < 4.0) {
    return "Minor earthquake. Often felt, but only causes minor damage.";
  } else if (magnitude < 5.0) {
    return "Light earthquake. Felt by all. Slight damage to well-built structures.";
  } else if (magnitude < 6.0) {
    return "Moderate earthquake. Causes damage to poorly constructed buildings.";
  } else if (magnitude < 7.0) {
    return "Strong earthquake. Causes damage to most buildings, can be destructive in populated areas.";
  } else if (magnitude < 8.0) {
    return "Major earthquake. Causes serious damage over larger areas. Can be destructive in areas up to about 100 km across.";
  } else {
    return "Great earthquake. Can cause serious damage in areas several hundred km across. Major devastation.";
  }
}

function getRichterDescription(magnitude: number): string {
  if (magnitude < 2.0) {
    return "Micro (< 2.0)";
  } else if (magnitude < 4.0) {
    return "Minor (2.0-3.9)";
  } else if (magnitude < 5.0) {
    return "Light (4.0-4.9)";
  } else if (magnitude < 6.0) {
    return "Moderate (5.0-5.9)";
  } else if (magnitude < 7.0) {
    return "Strong (6.0-6.9)";
  } else if (magnitude < 8.0) {
    return "Major (7.0-7.9)";
  } else {
    return "Great (≥ 8.0)";
  }
}